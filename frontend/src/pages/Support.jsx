import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetMyTickets, apiCreateSupportTicket,
  apiGetSupportMessages, apiSendSupportMessage,
  resolveMediaUrl,
} from "../api/client";
import { getSocket, connectSocket } from "../services/socketService";
import "./Support.css";

const TOPICS = {
  payment:      { label: "Thanh toán",     color: "#1d4ed8" },
  buy_ticket:   { label: "Mua vé",         color: "#059669" },
  pass_ticket:  { label: "Pass vé",        color: "#7c3aed" },
  ticket_issue: { label: "Vé lỗi",        color: "#dc2626" },
  not_received: { label: "Chưa nhận vé",  color: "#d97706" },
  withdrawal:   { label: "Rút tiền",      color: "#0891b2" },
  account:      { label: "Tài khoản",     color: "#64748b" },
  report_user:  { label: "Báo cáo user",  color: "#be123c" },
  fake_ticket:  { label: "Vé giả",        color: "#9f1239" },
  other:        { label: "Vấn đề khác",   color: "#94a3b8" },
};

const STATUS = {
  new:              { label: "Mới tạo",         cls: "sp-badge-new"      },
  pending:          { label: "Chờ xử lý",       cls: "sp-badge-pending"  },
  in_progress:      { label: "Đang xử lý",      cls: "sp-badge-progress" },
  waiting_customer: { label: "Chờ bạn phản hồi",cls: "sp-badge-waiting"  },
  resolved:         { label: "Đã giải quyết",   cls: "sp-badge-resolved" },
  closed:           { label: "Đã đóng",         cls: "sp-badge-closed"   },
};

function formatTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  const now = new Date();
  const diff = now - dt;
  if (diff < 60000)   return "Vừa xong";
  if (diff < 3600000) return `${Math.floor(diff/60000)} phút trước`;
  if (diff < 86400000)return `${Math.floor(diff/3600000)} giờ trước`;
  return dt.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit" });
}

const TOPIC_OPTIONS = Object.entries(TOPICS).map(([k,v]) => ({ value: k, label: v.label }));

export default function Support() {
  const { currentUser } = useAuth();

  const [tickets,     setTickets]     = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [activeTicket,setActiveTicket]= useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [imageFile,   setImageFile]   = useState(null);
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [typing,      setTyping]      = useState(false);
  const [mobileView,  setMobileView]  = useState("list"); // list | chat

  // New ticket form
  const [form, setForm] = useState({ subject: "", topic: "", message: "" });
  const [formErr, setFormErr]         = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);
  const inputRef       = useRef(null);
  const fileRef        = useRef(null);

  // Load tickets on mount
  useEffect(() => {
    if (!currentUser) return;
    apiGetMyTickets().then(res => {
      if (res.success) setTickets(res.data.tickets || []);
    });
  }, [currentUser]);

  // Open ticket
  const openTicket = useCallback(async (ticket) => {
    setActiveId(ticket._id);
    setActiveTicket(ticket);
    setMessages([]);
    setLoading(true);
    setMobileView("chat");

    const res = await apiGetSupportMessages(ticket._id);
    if (res.success) {
      setMessages(res.data.messages || []);
      // Update local ticket unreadByUser = 0
      setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadByUser: 0 } : t));
    }
    setLoading(false);

    // Join socket room
    const socket = connectSocket();
    socket.emit('join_support_room', { ticketId: ticket._id });
  }, []);

  // Leave room on change
  useEffect(() => {
    const socket = getSocket();
    return () => {
      if (activeId) socket?.emit('leave_support_room', { ticketId: activeId });
    };
  }, [activeId]);

  // Socket events
  useEffect(() => {
    const socket = connectSocket();
    function onMessage(msg) {
      if (msg.ticketId?.toString() === activeId || msg.ticketId === activeId) {
        setMessages(prev => {
          // Dedup: ignore if this _id already in list (REST response added it first)
          const id = msg._id?.toString();
          if (id && prev.some(m => m._id?.toString() === id)) return prev;
          return [...prev, msg];
        });
        if (msg.ticket?.status) {
          setActiveTicket(t => ({ ...t, status: msg.ticket.status }));
          setTickets(prev => prev.map(t => t._id === activeId ? { ...t, status: msg.ticket.status, lastMessage: msg.content || '[Hình ảnh]', lastMessageAt: msg.createdAt } : t));
        }
      } else {
        setTickets(prev => prev.map(t =>
          t._id === msg.ticketId ? { ...t, lastMessage: msg.content || '[Hình ảnh]', lastMessageAt: msg.createdAt, unreadByUser: (t.unreadByUser || 0) + 1 } : t
        ));
      }
    }
    function onTyping({ senderName }) { setTyping(senderName || "GoTix Support"); }
    function onStopTyping() { setTyping(false); }
    function onStatusChange({ ticketId, status }) {
      if (ticketId === activeId || ticketId?.toString() === activeId) {
        setActiveTicket(t => ({ ...t, status }));
        setTickets(prev => prev.map(t => t._id === activeId ? { ...t, status } : t));
      }
    }
    socket.on('support_message', onMessage);
    socket.on('support_typing', onTyping);
    socket.on('support_stop_typing', onStopTyping);
    socket.on('support_status_change', onStatusChange);
    return () => {
      socket.off('support_message', onMessage);
      socket.off('support_typing', onTyping);
      socket.off('support_stop_typing', onStopTyping);
      socket.off('support_status_change', onStatusChange);
    };
  }, [activeId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleInputChange(e) {
    setInput(e.target.value);
    const socket = getSocket();
    if (activeId && socket) {
      socket.emit('support_typing', { ticketId: activeId });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('support_stop_typing', { ticketId: activeId });
      }, 1500);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;
    if (!activeTicket || activeTicket.status === "closed") return;
    setSending(true);

    const fd = new FormData();
    if (input.trim()) fd.append("content", input.trim());
    if (imageFile)    fd.append("image", imageFile);

    try {
      const res = await apiSendSupportMessage(activeTicket._id, fd);
      if (res.success) {
        setMessages(prev => [...prev, res.data.message]);
        setTickets(prev => prev.map(t => t._id === activeTicket._id
          ? { ...t, lastMessage: input.trim() || '[Hình ảnh]', lastMessageAt: new Date().toISOString() }
          : t
        ));
        setInput("");
        setImageFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally { setSending(false); }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setFormErr("");
    if (!form.subject.trim()) return setFormErr("Vui lòng nhập tiêu đề");
    if (!form.topic) return setFormErr("Vui lòng chọn chủ đề");
    if (!form.message.trim()) return setFormErr("Vui lòng mô tả vấn đề");
    setFormLoading(true);
    try {
      const res = await apiCreateSupportTicket(form);
      if (res.success) {
        const ticket = res.data.ticket;
        setTickets(prev => [ticket, ...prev]);
        setShowNew(false);
        setForm({ subject: "", topic: "", message: "" });
        await openTicket(ticket);
      } else { setFormErr(res.message || "Tạo thất bại"); }
    } finally { setFormLoading(false); }
  }

  const currentUserId = currentUser?._id?.toString() || currentUser?.id;

  return (
    <div className="sp-page">
      {/* ── Header ── */}
      <div className="sp-header">
        <div className="sp-header-left">
          <h1>Trung tâm hỗ trợ GoTix</h1>
          <p>Đội ngũ GoTix luôn sẵn sàng hỗ trợ bạn trong quá trình mua và pass vé.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + Tạo yêu cầu hỗ trợ
        </button>
      </div>

      {/* ── New ticket modal ── */}
      {showNew && (
        <div className="sp-modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="sp-modal">
            <div className="sp-modal-header">
              <h3>Tạo yêu cầu hỗ trợ</h3>
              <button className="sp-modal-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="sp-modal-body">
              {formErr && <div className="alert alert-error">{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Chủ đề <span style={{color:"red"}}>*</span></label>
                <select className="form-select" value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))} required>
                  <option value="">Chọn chủ đề</option>
                  {TOPIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tiêu đề <span style={{color:"red"}}>*</span></label>
                <input className="form-input" placeholder="Mô tả ngắn vấn đề của bạn"
                  value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nội dung chi tiết <span style={{color:"red"}}>*</span></label>
                <textarea className="form-textarea" rows="5"
                  placeholder="Mô tả chi tiết vấn đề, mã giao dịch, tên vé, hoặc thông tin liên quan..."
                  value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} required />
              </div>
              <div className="sp-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="sp-layout">

        {/* Ticket list */}
        <div className={`sp-list ${mobileView === "chat" ? "sp-hidden-mobile" : ""}`}>
          <div className="sp-list-header">
            <span className="sp-list-title">Yêu cầu của tôi</span>
            <span className="sp-list-count">{tickets.length}</span>
          </div>
          {tickets.length === 0 ? (
            <div className="sp-empty">
              <div style={{fontSize:36,marginBottom:8}}>🎫</div>
              <p>Chưa có yêu cầu hỗ trợ nào</p>
              <button className="btn btn-outline btn-sm" onClick={() => setShowNew(true)}>Tạo yêu cầu đầu tiên</button>
            </div>
          ) : (
            tickets.map(t => (
              <div
                key={t._id}
                className={`sp-ticket-item ${activeId === t._id ? "active" : ""}`}
                onClick={() => openTicket(t)}
              >
                <div className="sp-ticket-top">
                  <span className="sp-topic-badge" style={{ background: TOPICS[t.topic]?.color + "15", color: TOPICS[t.topic]?.color }}>
                    {TOPICS[t.topic]?.label || t.topic}
                  </span>
                  <span className={`sp-status-badge ${STATUS[t.status]?.cls}`}>
                    {STATUS[t.status]?.label}
                  </span>
                  {t.unreadByUser > 0 && (
                    <span className="sp-unread-dot">{t.unreadByUser}</span>
                  )}
                </div>
                <div className="sp-ticket-subject">{t.subject}</div>
                {t.lastMessage && (
                  <div className="sp-ticket-last">{t.lastMessage}</div>
                )}
                <div className="sp-ticket-time">{formatTime(t.lastMessageAt || t.createdAt)}</div>
              </div>
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className={`sp-chat-panel ${mobileView === "list" ? "sp-hidden-mobile" : ""}`}>
          {!activeTicket ? (
            <div className="sp-chat-empty">
              <div style={{fontSize:48,marginBottom:12}}>💬</div>
              <h3>Chọn yêu cầu hỗ trợ</h3>
              <p>Chọn một yêu cầu từ danh sách hoặc tạo yêu cầu mới để nhắn tin với đội hỗ trợ GoTix.</p>
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Tạo yêu cầu</button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="sp-chat-header">
                <button className="sp-back-btn" onClick={() => setMobileView("list")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                </button>
                <div className="sp-chat-title">
                  <span className="sp-topic-badge" style={{ background: TOPICS[activeTicket.topic]?.color + "15", color: TOPICS[activeTicket.topic]?.color }}>
                    {TOPICS[activeTicket.topic]?.label}
                  </span>
                  <strong>{activeTicket.subject}</strong>
                </div>
                <span className={`sp-status-badge ${STATUS[activeTicket.status]?.cls}`}>
                  {STATUS[activeTicket.status]?.label}
                </span>
              </div>

              {/* Messages */}
              <div className="sp-messages">
                {loading ? (
                  <div className="sp-loading">Đang tải...</div>
                ) : messages.length === 0 ? (
                  <div className="sp-chat-hint">
                    <p>Yêu cầu đã được tạo. Đội hỗ trợ GoTix sẽ phản hồi trong thời gian sớm nhất.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId?._id?.toString() === currentUserId ||
                                 msg.senderId?.toString() === currentUserId;
                    return (
                      <div key={msg._id} className={`sp-msg ${isMe ? "sp-msg-me" : "sp-msg-other"}`}>
                        {!isMe && (
                          <div className="sp-msg-avatar">
                            {msg.senderRole === "admin" ? "🛡️" : msg.senderId?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="sp-msg-content">
                          {!isMe && (
                            <div className="sp-msg-sender">
                              {msg.senderRole === "admin" ? "GoTix Support" : msg.senderId?.name}
                            </div>
                          )}
                          {msg.content && <div className="sp-msg-bubble">{msg.content}</div>}
                          {msg.image && (
                            <img
                              src={resolveMediaUrl(msg.image)}
                              alt="attachment"
                              className="sp-msg-image"
                              onClick={() => window.open(resolveMediaUrl(msg.image), '_blank')}
                            />
                          )}
                          <div className="sp-msg-time">{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                {typing && (
                  <div className="sp-msg sp-msg-other">
                    <div className="sp-msg-avatar">🛡️</div>
                    <div className="sp-msg-content">
                      <div className="sp-msg-sender">{typeof typing === "string" ? typing : "GoTix Support"}</div>
                      <div className="sp-typing-indicator"><span/><span/><span/></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeTicket.status === "closed" ? (
                <div className="sp-closed-notice">
                  Yêu cầu này đã đóng. Nếu bạn vẫn cần hỗ trợ, vui lòng <button className="sp-link-btn" onClick={() => setShowNew(true)}>tạo yêu cầu mới</button>.
                </div>
              ) : (
                <form className="sp-input-area" onSubmit={handleSend}>
                  {imageFile && (
                    <div className="sp-img-preview">
                      <img src={URL.createObjectURL(imageFile)} alt="preview"/>
                      <button type="button" onClick={() => { setImageFile(null); if(fileRef.current) fileRef.current.value=""; }}>✕</button>
                    </div>
                  )}
                  <div className="sp-input-row">
                    <button type="button" className="sp-attach-btn" onClick={() => fileRef.current?.click()} title="Đính kèm ảnh">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => setImageFile(e.target.files[0] || null)} />
                    <input
                      ref={inputRef}
                      className="sp-input"
                      placeholder="Nhắn tin với đội hỗ trợ..."
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
                    />
                    <button type="submit" className="sp-send-btn" disabled={sending || (!input.trim() && !imageFile)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
