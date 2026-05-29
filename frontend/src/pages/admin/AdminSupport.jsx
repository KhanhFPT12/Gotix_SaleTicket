import { useState, useEffect, useRef, useCallback } from "react";
import {
  apiAdminGetTickets, apiAdminGetMessages,
  apiAdminSendMessage, apiAdminUpdateStatus,
  resolveMediaUrl,
} from "../../api/client";
import { getSocket, connectSocket } from "../../services/socketService";
import "../../layouts/AdminLayout.css";

const TOPICS = {
  payment:      { label: "Thanh toán",    color: "#1d4ed8" },
  ticket_issue: { label: "Vé lỗi",       color: "#dc2626" },
  not_received: { label: "Chưa nhận vé", color: "#d97706" },
  withdrawal:   { label: "Rút tiền",     color: "#7c3aed" },
  account:      { label: "Tài khoản",    color: "#0891b2" },
  report_user:  { label: "Báo cáo user", color: "#be123c" },
  other:        { label: "Khác",         color: "#64748b" },
};

const STATUS_CFG = {
  pending:     { label: "Chờ xử lý",     cls: "admin-badge-warning" },
  in_progress: { label: "Đang xử lý",    cls: "admin-badge-info"    },
  resolved:    { label: "Đã giải quyết", cls: "admin-badge-success" },
  closed:      { label: "Đã đóng",       cls: "admin-badge-neutral" },
};

const STATUS_ACTIONS = [
  { value: "in_progress", label: "Đánh dấu đang xử lý", cls: "admin-btn admin-btn-approve" },
  { value: "resolved",    label: "Đã giải quyết",       cls: "admin-btn" },
  { value: "closed",      label: "Đóng yêu cầu",        cls: "admin-btn admin-btn-reject" },
  { value: "pending",     label: "Mở lại",              cls: "admin-btn" },
];

function formatTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}

export default function AdminSupport() {
  const [tickets,      setTickets]      = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [sending,      setSending]      = useState(false);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTopic,  setFilterTopic]  = useState("");
  const [search,       setSearch]       = useState("");
  const [typing,       setTyping]       = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);
  const fileRef        = useRef(null);

  const loadTickets = useCallback(async () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterTopic)  params.topic  = filterTopic;
    if (search)       params.search = search;
    const res = await apiAdminGetTickets(params);
    if (res.success) setTickets(res.data.tickets || []);
  }, [filterStatus, filterTopic, search]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTicket = useCallback(async (ticket) => {
    // Leave previous room
    const socket = connectSocket();
    if (activeTicket) socket.emit('leave_support_room', { ticketId: activeTicket._id });

    setActiveTicket(ticket);
    setMessages([]);
    setLoadingMsgs(true);

    const res = await apiAdminGetMessages(ticket._id);
    if (res.success) {
      setMessages(res.data.messages || []);
      setActiveTicket(res.data.ticket || ticket);
      setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadByAdmin: 0 } : t));
    }
    setLoadingMsgs(false);

    socket.emit('join_support_room', { ticketId: ticket._id });
  }, [activeTicket]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (activeTicket) getSocket()?.emit('leave_support_room', { ticketId: activeTicket._id });
  }, [activeTicket]);

  // Socket events
  useEffect(() => {
    const socket = connectSocket();
    function onMessage(msg) {
      const tid = msg.ticketId?.toString?.() || msg.ticketId;
      if (tid === activeTicket?._id?.toString()) {
        setMessages(prev => [...prev, msg]);
        if (msg.ticket?.status) {
          setActiveTicket(t => ({ ...t, status: msg.ticket.status }));
        }
      }
      setTickets(prev => prev.map(t =>
        (t._id === tid || t._id?.toString() === tid)
          ? { ...t, lastMessage: msg.content || '[Hình ảnh]', lastMessageAt: msg.createdAt,
              unreadByAdmin: t._id?.toString() !== activeTicket?._id?.toString() ? (t.unreadByAdmin || 0) + 1 : 0 }
          : t
      ));
    }
    function onTyping({ senderName }) { setTyping(senderName || "User"); }
    function onStopTyping() { setTyping(false); }
    function onStatusChange({ ticketId, status }) {
      if (ticketId === activeTicket?._id?.toString()) {
        setActiveTicket(t => ({ ...t, status }));
      }
      setTickets(prev => prev.map(t => (t._id?.toString() === ticketId?.toString() ? { ...t, status } : t)));
    }
    socket.on('support_message',       onMessage);
    socket.on('support_typing',        onTyping);
    socket.on('support_stop_typing',   onStopTyping);
    socket.on('support_status_change', onStatusChange);
    return () => {
      socket.off('support_message',       onMessage);
      socket.off('support_typing',        onTyping);
      socket.off('support_stop_typing',   onStopTyping);
      socket.off('support_status_change', onStatusChange);
    };
  }, [activeTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleInputChange(e) {
    setInput(e.target.value);
    const socket = getSocket();
    if (activeTicket && socket) {
      socket.emit('support_typing', { ticketId: activeTicket._id });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('support_stop_typing', { ticketId: activeTicket._id }), 1500);
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
      const res = await apiAdminSendMessage(activeTicket._id, fd);
      if (res.success) {
        setMessages(prev => [...prev, res.data.message]);
        setTickets(prev => prev.map(t => t._id === activeTicket._id
          ? { ...t, lastMessage: input.trim() || '[Hình ảnh]', lastMessageAt: new Date().toISOString(), status: res.data.message?.ticket?.status || t.status }
          : t
        ));
        if (activeTicket.status === "pending") setActiveTicket(t => ({ ...t, status: "in_progress" }));
        setInput("");
        setImageFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally { setSending(false); }
  }

  async function handleStatusChange(status) {
    if (!activeTicket) return;
    const res = await apiAdminUpdateStatus(activeTicket._id, status);
    if (res.success) {
      setActiveTicket(t => ({ ...t, status }));
      setTickets(prev => prev.map(t => t._id === activeTicket._id ? { ...t, status } : t));
    }
  }

  const pendingCount = tickets.filter(t => t.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Hỗ trợ khách hàng</h1>
        <p className="admin-page-subtitle">Quản lý và xử lý các yêu cầu hỗ trợ từ người dùng</p>
      </div>

      {/* Stats */}
      <div className="admin-stats-row" style={{ marginBottom: 16 }}>
        {["pending","in_progress","resolved","closed"].map(s => (
          <div key={s} className="admin-stat-card"
            style={{ borderTop: s === "pending" && pendingCount > 0 ? "3px solid #f59e0b" : undefined }}>
            <p className="admin-stat-label">{STATUS_CFG[s].label}</p>
            <p className="admin-stat-value" style={{ color: s === "pending" && pendingCount > 0 ? "#d97706" : undefined }}>
              {tickets.filter(t => t.status === s).length}
            </p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 0, flex: 1, border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden", minHeight: 500 }}>

        {/* Ticket list */}
        <div style={{ borderRight: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-white)" }}>
          {/* Filters */}
          <div style={{ padding: "12px", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="admin-search" style={{ width: "100%", boxSizing: "border-box" }}
              placeholder="Tìm tiêu đề..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: "flex", gap: 6 }}>
              <select className="admin-search" style={{ flex: 1 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="admin-search" style={{ flex: 1 }} value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
                <option value="">Tất cả chủ đề</option>
                {Object.entries(TOPICS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {tickets.length === 0 ? (
              <div className="admin-empty">Không có yêu cầu nào.</div>
            ) : tickets.map(t => (
              <div
                key={t._id}
                onClick={() => openTicket(t)}
                style={{
                  padding: "12px 14px", cursor: "pointer",
                  borderBottom: "1px solid var(--color-border)",
                  background: activeTicket?._id === t._id ? "#eff6ff" : "var(--bg-white)",
                  borderLeft: activeTicket?._id === t._id ? "3px solid var(--color-primary)" : "3px solid transparent",
                  transition: "background 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100,
                    background: TOPICS[t.topic]?.color + "18", color: TOPICS[t.topic]?.color }}>
                    {TOPICS[t.topic]?.label}
                  </span>
                  <span className={`admin-badge ${STATUS_CFG[t.status]?.cls}`} style={{ fontSize: 10 }}>
                    {STATUS_CFG[t.status]?.label}
                  </span>
                  {t.unreadByAdmin > 0 && (
                    <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {t.unreadByAdmin}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.subject}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.userId?.name || "–"}
                    {t.lastMessage && ` · ${t.lastMessage}`}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                    {t.lastMessageAt ? formatTime(t.lastMessageAt) : formatTime(t.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-white)" }}>
          {!activeTicket ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "var(--color-text)" }}>Chọn yêu cầu hỗ trợ</h3>
              <p style={{ fontSize: "0.875rem", maxWidth: 300, lineHeight: 1.6 }}>Chọn một yêu cầu từ danh sách bên trái để xem và trả lời.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: TOPICS[activeTicket.topic]?.color + "18", color: TOPICS[activeTicket.topic]?.color }}>
                      {TOPICS[activeTicket.topic]?.label}
                    </span>
                    <span className={`admin-badge ${STATUS_CFG[activeTicket.status]?.cls}`} style={{ fontSize: 11 }}>
                      {STATUS_CFG[activeTicket.status]?.label}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {activeTicket.subject}
                  </div>
                  {activeTicket.userId && (
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                      👤 {activeTicket.userId.name} · {activeTicket.userId.email}
                    </div>
                  )}
                </div>
                {/* Status actions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STATUS_ACTIONS
                    .filter(a => a.value !== activeTicket.status)
                    .map(a => (
                      <button key={a.value} className={a.cls} style={{ fontSize: 12 }}
                        onClick={() => handleStatusChange(a.value)}>
                        {a.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-light)" }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>Đang tải...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem", fontSize: 14 }}>Chưa có tin nhắn.</div>
                ) : messages.map(msg => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div key={msg._id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isAdmin ? "row-reverse" : "row" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: isAdmin ? "var(--color-primary)" : "#e5e7eb", color: isAdmin ? "#fff" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {isAdmin ? "🛡️" : msg.senderId?.name?.charAt(0) || "?"}
                      </div>
                      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: 3, alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>
                          {isAdmin ? "GoTix Support" : msg.senderId?.name}
                        </div>
                        {msg.content && (
                          <div style={{ background: isAdmin ? "var(--color-primary)" : "var(--bg-white)", color: isAdmin ? "#fff" : "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: isAdmin ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 12px", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>
                            {msg.content}
                          </div>
                        )}
                        {msg.image && (
                          <img src={resolveMediaUrl(msg.image)} alt="attachment"
                            style={{ maxWidth: 200, maxHeight: 180, borderRadius: 8, cursor: "pointer", border: "1px solid var(--color-border)" }}
                            onClick={() => window.open(resolveMediaUrl(msg.image), '_blank')} />
                        )}
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{formatTime(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      {typeof typing === "string" ? typing.charAt(0) : "?"}
                    </div>
                    <div style={{ background: "var(--bg-white)", border: "1px solid var(--color-border)", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", display: "flex", gap: 4 }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, background: "#94a3b8", borderRadius: "50%", animation: "sp-bounce 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s`, display: "block" }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeTicket.status === "closed" ? (
                <div style={{ padding: "14px 16px", background: "var(--bg-muted)", textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)" }}>
                  Yêu cầu đã đóng.
                </div>
              ) : (
                <form onSubmit={handleSend} style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", background: "var(--bg-white)" }}>
                  {imageFile && (
                    <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                      <img src={URL.createObjectURL(imageFile)} alt="" style={{ height: 56, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                      <button type="button" onClick={() => { setImageFile(null); if(fileRef.current) fileRef.current.value=""; }}
                        style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#374151", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "6px", borderRadius: 6, display: "flex" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setImageFile(e.target.files[0] || null)} />
                    <input
                      style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: 24, padding: "8px 14px", fontSize: 13, outline: "none", background: "var(--bg-light)" }}
                      placeholder="Trả lời..."
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
                    />
                    <button type="submit" disabled={sending || (!input.trim() && !imageFile)}
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (sending || (!input.trim() && !imageFile)) ? 0.4 : 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
