import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { apiGetPublicProfile, apiGet, resolveMediaUrl, normalizeTicket } from "../api/client";
import "./Chat.css";

const QUICK_REPLIES = [
  "Vé này còn không?",
  "Có thương lượng được không?",
  "Mình lấy ngay được không?",
  "Vé còn mấy chỗ?",
  "Có thể chuyển vé ngay không?",
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày`;
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = "md", online }) {
  return (
    <div className={`c-avatar c-avatar--${size}`}>
      {avatar
        ? <img src={resolveMediaUrl(avatar)} alt={name} />
        : <span>{name?.charAt(0)?.toUpperCase() ?? "?"}</span>
      }
      {online !== undefined && (
        <span className={`c-avatar__dot ${online ? "c-avatar__dot--on" : "c-avatar__dot--off"}`} />
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="c-typing">
      <span /><span /><span />
    </div>
  );
}

// ── Single conversation row in sidebar ───────────────────────────────────────
function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      className={`conv-item${isActive ? " conv-item--active" : ""}${conv.unreadCount > 0 ? " conv-item--unread" : ""}`}
      onClick={onClick}
    >
      <Avatar name={conv.otherUser.name} avatar={conv.otherUser.avatar} size="md" />
      <div className="conv-item__body">
        <div className="conv-item__top">
          <span className="conv-item__name">{conv.otherUser.name}</span>
          <span className="conv-item__time">{timeAgo(conv.lastMessageAt)}</span>
        </div>
        <div className="conv-item__bottom">
          <span className="conv-item__preview">
            {conv.isLastMine ? "Bạn: " : ""}
            {conv.lastMessage || "Bắt đầu chat"}
          </span>
          {conv.unreadCount > 0 && (
            <span className="conv-item__badge">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>
          )}
        </div>
        {conv.ticketTitle && <p className="conv-item__ticket">{conv.ticketTitle}</p>}
      </div>
    </button>
  );
}

// ── Left sidebar ──────────────────────────────────────────────────────────────
function ConversationSidebar({ conversations, activeConv, onOpen }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  const filtered = conversations
    .filter((c) => (tab === "unread" ? c.unreadCount > 0 : true))
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.otherUser.name.toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q) ||
        (c.ticketTitle || "").toLowerCase().includes(q)
      );
    });

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__top">
        <h2 className="chat-sidebar__title">Tin nhắn</h2>
      </div>

      <div className="chat-sidebar__search">
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-sidebar__tabs">
        <button
          className={`c-tab${tab === "all" ? " c-tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả
        </button>
        <button
          className={`c-tab${tab === "unread" ? " c-tab--active" : ""}`}
          onClick={() => setTab("unread")}
        >
          Chưa đọc
          {unreadCount > 0 && <span className="c-tab__badge">{unreadCount}</span>}
        </button>
      </div>

      <div className="chat-sidebar__list">
        {filtered.length === 0 ? (
          <p className="chat-sidebar__empty">
            {search ? "Không tìm thấy kết quả" : "Chưa có cuộc trò chuyện nào"}
          </p>
        ) : (
          filtered.map((conv) => {
            const isActive =
              activeConv?.otherUser._id === conv.otherUser._id &&
              (activeConv?.ticketId ?? null) === (conv.ticketId ?? null);
            return (
              <ConversationItem
                key={conv.key}
                conv={conv}
                isActive={isActive}
                onClick={() => onOpen(conv)}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}

// ── Ticket preview card below chat header ─────────────────────────────────────
function TicketPreviewCard({ ticketData, ticketId }) {
  if (!ticketId || !ticketData) return null;
  const price = ticketData.passPrice
    ? new Intl.NumberFormat("vi-VN").format(ticketData.passPrice) + "đ"
    : null;
  return (
    <div className="ticket-card">
      {ticketData.images?.[0] && (
        <img src={ticketData.images[0]} alt={ticketData.title} className="ticket-card__img" />
      )}
      <div className="ticket-card__info">
        <p className="ticket-card__name">{ticketData.title}</p>
        {price && <p className="ticket-card__price">{price}</p>}
      </div>
      <Link to={`/tickets/${ticketId}`} className="ticket-card__link" target="_blank" rel="noopener noreferrer">
        Xem tin
      </Link>
    </div>
  );
}

// ── Chat window header ────────────────────────────────────────────────────────
function ChatWindowHeader({ otherUser, isOnline }) {
  return (
    <div className="chat-win-header">
      <Link to={`/users/${otherUser._id}`} className="chat-win-header__user-link">
        <Avatar name={otherUser.name} avatar={otherUser.avatar} size="sm" online={isOnline} />
      </Link>
      <div className="chat-win-header__info">
        <Link to={`/users/${otherUser._id}`} className="chat-win-header__name-link">
          <p className="chat-win-header__name">{otherUser.name}</p>
        </Link>
        <p className={`chat-win-header__status${isOnline ? " status--on" : " status--off"}`}>
          {isOnline ? "Đang hoạt động" : "Không hoạt động"}
        </p>
      </div>
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, isLast, otherUser }) {
  const showRead = isMine && isLast && msg.isRead;
  const time = new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`msg-row${isMine ? " msg-row--mine" : " msg-row--theirs"}`}>
      {!isMine && <Avatar name={otherUser.name} avatar={otherUser.avatar} size="xs" />}
      <div className="msg-bubble">
        <p>{msg.message}</p>
        <div className="msg-meta">
          <span className="msg-time">{time}</span>
          {showRead && <span className="msg-seen">Đã xem</span>}
        </div>
      </div>
    </div>
  );
}

// ── Quick reply pills ─────────────────────────────────────────────────────────
function QuickReplyBar({ onSelect }) {
  return (
    <div className="quick-bar">
      {QUICK_REPLIES.map((text) => (
        <button key={text} className="quick-pill" onClick={() => onSelect(text)}>
          {text}
        </button>
      ))}
    </div>
  );
}

// ── Input bar ─────────────────────────────────────────────────────────────────
function ChatInput({ input, onChange, onKeyDown, onSend, sending }) {
  return (
    <form className="chat-input-bar" onSubmit={onSend}>
      <input
        type="text"
        className="chat-input-field"
        placeholder="Nhập tin nhắn..."
        value={input}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={sending}
        autoComplete="off"
      />
      <button type="submit" className="chat-send-btn" disabled={!input.trim() || sending}>
        {sending ? (
          <span style={{ fontSize: 12 }}>...</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </form>
  );
}

// ── Main Chat page ────────────────────────────────────────────────────────────
export default function Chat() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const targetSellerId = searchParams.get("sellerId");
  const targetTicketId = searchParams.get("ticketId");

  const {
    conversations,
    activeConv,
    messages,
    typingUsers,
    loadingMessages,
    onlineUsers,
    openConversation,
    sendMessage,
    emitTyping,
    emitStopTyping,
  } = useChat();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ticketData, setTicketData] = useState(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = currentUser?._id?.toString() ?? currentUser?.id ?? "";

  // Auto-open từ URL params
  useEffect(() => {
    if (!targetSellerId || !currentUser) return;
    if (targetSellerId === currentUserId) return;

    async function openFromParams() {
      let userInfo = null;
      let ticketInfo = null;
      try {
        const [uRes, tRes] = await Promise.all([
          apiGetPublicProfile(targetSellerId),
          targetTicketId ? apiGet(`/tickets/${targetTicketId}`) : Promise.resolve(null),
        ]);
        if (uRes?.success) {
          userInfo = {
            _id: targetSellerId,
            name: uRes.data.user?.name ?? "Người dùng",
            avatar: uRes.data.user?.avatar ?? null,
          };
        }
        if (tRes?.success) ticketInfo = { title: tRes.data.ticket?.title };
      } catch {}
      openConversation(targetSellerId, targetTicketId, userInfo, ticketInfo);
    }

    openFromParams();
  }, [targetSellerId, targetTicketId, currentUser, openConversation, currentUserId]);

  // Fetch ticket data khi đổi conversation
  useEffect(() => {
    if (!activeConv?.ticketId) { setTicketData(null); return; }
    apiGet(`/tickets/${activeConv.ticketId}`)
      .then((res) => { if (res.success) setTicketData(normalizeTicket(res.data.ticket)); })
      .catch(() => {});
  }, [activeConv?.ticketId]);

  // Scroll xuống cuối trong container — không kéo cả page
  useEffect(() => {
    const box = messagesContainerRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      if (!activeConv) return;
      emitTyping(activeConv.otherUser._id);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitStopTyping(activeConv.otherUser._id), 1500);
    },
    [activeConv, emitTyping, emitStopTyping]
  );

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (activeConv) emitStopTyping(activeConv.otherUser._id);
    };
  }, [activeConv]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setError("");
    setSending(true);
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping(activeConv.otherUser._id);
    try {
      await sendMessage(activeConv.otherUser._id, activeConv.ticketId, input.trim());
      setInput("");
    } catch (err) {
      setError(err.message || "Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  }

  function handleOpenConv(conv) {
    openConversation(
      conv.otherUser._id,
      conv.ticketId,
      conv.otherUser,
      conv.ticketTitle ? { title: conv.ticketTitle } : null
    );
  }

  const isTyping = activeConv && typingUsers.has(activeConv.otherUser._id);
  const isOnline = activeConv ? (onlineUsers?.has(activeConv.otherUser._id) ?? false) : false;

  return (
    <div className="chat-page">
      <div className="chat-layout">
        <ConversationSidebar
          conversations={conversations}
          activeConv={activeConv}
          onOpen={handleOpenConv}
        />

        <div className="chat-window">
          {activeConv ? (
            <>
              <ChatWindowHeader otherUser={activeConv.otherUser} isOnline={isOnline} />

              {activeConv.ticketId && (
                <TicketPreviewCard ticketData={ticketData} ticketId={activeConv.ticketId} />
              )}

              <div className="chat-messages" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="chat-state">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="chat-state">Bắt đầu cuộc trò chuyện</div>
                ) : (
                  messages.map((msg, idx) => {
                    const sId = msg.senderId?._id?.toString() ?? msg.senderId?.toString?.() ?? msg.senderId ?? "";
                    const isMine = sId === currentUserId;
                    const isLast = idx === messages.length - 1;
                    return (
                      <MessageBubble
                        key={msg._id ?? idx}
                        msg={msg}
                        isMine={isMine}
                        isLast={isLast}
                        otherUser={activeConv.otherUser}
                      />
                    );
                  })
                )}

                {isTyping && (
                  <div className="msg-row msg-row--theirs">
                    <Avatar name={activeConv.otherUser.name} avatar={activeConv.otherUser.avatar} size="xs" />
                    <div className="msg-bubble msg-bubble--typing">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

              </div>

              {error && <div className="chat-error-bar">{error}</div>}

              <QuickReplyBar onSelect={(text) => setInput(text)} />
              <ChatInput
                input={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onSend={handleSend}
                sending={sending}
              />
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="chat-empty-state__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
