import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USERS, TICKETS, CHAT_MESSAGES } from "../data/mockData";
import "./Chat.css";

function getConversations(messages, currentUserId) {
  const convMap = {};
  messages.forEach((msg) => {
    const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
    if (!convMap[otherId]) {
      convMap[otherId] = { userId: otherId, messages: [], ticketId: msg.ticketId };
    }
    convMap[otherId].messages.push(msg);
  });
  return Object.values(convMap);
}

export default function Chat() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const targetSellerId = searchParams.get("sellerId");
  const ticketId = searchParams.get("ticketId");

  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const conversations = getConversations(messages, currentUser?.id);

  const initialConvUser = targetSellerId || conversations[0]?.userId;
  const [activeConvId, setActiveConvId] = useState(initialConvUser);

  useEffect(() => {
    if (targetSellerId) setActiveConvId(targetSellerId);
  }, [targetSellerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConvId]);

  const activeMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser?.id && m.receiverId === activeConvId) ||
      (m.senderId === activeConvId && m.receiverId === currentUser?.id)
  );

  const activeUser = USERS.find((u) => u.id === activeConvId);
  const activeTicket = activeMessages[0] ? TICKETS.find((t) => t.id === (ticketId || activeMessages[0].ticketId)) : null;

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeConvId) return;
    const newMsg = {
      id: `msg${Date.now()}`,
      chatId: "chat1",
      senderId: currentUser.id,
      receiverId: activeConvId,
      ticketId: ticketId || activeMessages[0]?.ticketId || "",
      message: input.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  }

  const allContacts = targetSellerId
    ? [...new Set([...conversations.map(c => c.userId), targetSellerId])]
    : conversations.map(c => c.userId);

  return (
    <div className="chat-page">
      <div className="container">
        <h1 className="page-heading">Tin nhắn</h1>
        <div className="chat-layout">
          {/* Contacts */}
          <aside className="chat-contacts">
            {allContacts.length === 0 && targetSellerId === null ? (
              <div className="chat-empty-contacts">Chưa có cuộc trò chuyện nào.</div>
            ) : (
              allContacts.map((uid) => {
                const user = USERS.find((u) => u.id === uid);
                if (!user) return null;
                const lastMsg = messages.filter(
                  m => (m.senderId === uid || m.receiverId === uid) &&
                       (m.senderId === currentUser?.id || m.receiverId === currentUser?.id)
                ).slice(-1)[0];
                return (
                  <button
                    key={uid}
                    className={`contact-item ${activeConvId === uid ? "active" : ""}`}
                    onClick={() => setActiveConvId(uid)}
                  >
                    <div className="contact-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <div className="contact-info">
                      <p className="contact-name">{user.name}</p>
                      <p className="contact-last">{lastMsg?.message || "Bắt đầu chat"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </aside>

          {/* Chat window */}
          <div className="chat-window">
            {activeConvId ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    <div className="contact-avatar sm">
                      {activeUser?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="chat-header-name">{activeUser?.name}</p>
                      {activeTicket && (
                        <p className="chat-header-ticket">{activeTicket.title}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-messages">
                  {activeMessages.length === 0 ? (
                    <div className="chat-start-hint">
                      <p>Hỏi người bán về vé</p>
                      {activeTicket && (
                        <div className="ticket-preview">
                          <strong>{activeTicket.title}</strong>
                          <span>{new Intl.NumberFormat("vi-VN").format(activeTicket.passPrice)}đ</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isMine = msg.senderId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                          {!isMine && (
                            <div className="msg-avatar">{activeUser?.name?.charAt(0)}</div>
                          )}
                          <div className="message-bubble">
                            <p>{msg.message}</p>
                            <span className="msg-time">
                              {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-bar" onSubmit={sendMessage}>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
                    Gửi
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-placeholder">
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
