import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  apiStaffGetTickets, apiStaffGetMessages,
  apiStaffSendMessage, apiStaffUpdateStatus,
  apiStaffUpdatePriority, apiStaffAssign,
  resolveMediaUrl,
} from "../../api/client";
import { getSocket, connectSocket } from "../../services/socketService";
import "./StaffSupport.css";

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
  other:        { label: "Khác",          color: "#94a3b8" },
};

const STATUSES = {
  new:              { label: "Mới tạo",           cls: "ss-s-new"       },
  pending:          { label: "Chờ xử lý",         cls: "ss-s-pending"   },
  in_progress:      { label: "Đang xử lý",        cls: "ss-s-progress"  },
  waiting_customer: { label: "Chờ KH phản hồi",   cls: "ss-s-waiting"   },
  resolved:         { label: "Đã giải quyết",     cls: "ss-s-resolved"  },
  closed:           { label: "Đã đóng",           cls: "ss-s-closed"    },
};

const PRIORITIES = {
  low:    { label: "Thấp",    cls: "ss-p-low"    },
  medium: { label: "TB",      cls: "ss-p-medium" },
  high:   { label: "Cao",     cls: "ss-p-high"   },
  urgent: { label: "Khẩn",   cls: "ss-p-urgent"  },
};

const STATUS_ACTIONS = [
  { value: "in_progress",      label: "Đang xử lý"      },
  { value: "waiting_customer", label: "Chờ KH phản hồi" },
  { value: "resolved",         label: "Đã giải quyết"   },
  { value: "closed",           label: "Đóng"             },
  { value: "pending",          label: "Mở lại"           },
];

function formatTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  const now = new Date();
  const diff = now - dt;
  if (diff < 60000)    return "Vừa xong";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}p trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h trước`;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
function formatFull(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function StaffSupport() {
  const { currentUser } = useAuth();

  const [tickets,      setTickets]      = useState([]);
  const [stats,        setStats]        = useState({});
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [imageFile,    setImageFile]    = useState(null);
  const [sending,      setSending]      = useState(false);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [typing,       setTyping]       = useState(false);
  const [mobilePane,   setMobilePane]   = useState("list"); // list | chat

  // Filters
  const [fStatus,   setFStatus]   = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fTopic,    setFTopic]    = useState("");
  const [fSearch,   setFSearch]   = useState("");
  const [fAssigned, setFAssigned] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimer    = useRef(null);
  const fileRef        = useRef(null);

  // Load tickets
  const loadTickets = useCallback(async () => {
    const params = {};
    if (fStatus)   params.status   = fStatus;
    if (fPriority) params.priority = fPriority;
    if (fTopic)    params.topic    = fTopic;
    if (fSearch)   params.search   = fSearch;
    if (fAssigned) params.assignedTo = fAssigned;
    const res = await apiStaffGetTickets(params);
    if (res.success) {
      setTickets(res.data.tickets || []);
      setStats(res.data.stats || {});
    }
  }, [fStatus, fPriority, fTopic, fSearch, fAssigned]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Open ticket
  const openTicket = useCallback(async (ticket) => {
    const socket = connectSocket();
    if (activeTicket) socket.emit("leave_support_room", { ticketId: activeTicket._id });

    setActiveTicket(ticket);
    setMessages([]);
    setLoadingMsgs(true);
    setMobilePane("chat");

    const res = await apiStaffGetMessages(ticket._id);
    if (res.success) {
      setMessages(res.data.messages || []);
      setActiveTicket(res.data.ticket || ticket);
      setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadByStaff: 0 } : t));
    }
    setLoadingMsgs(false);
    socket.emit("join_support_room", { ticketId: ticket._id });
  }, [activeTicket]);

  // Socket events
  useEffect(() => {
    const socket = connectSocket();
    function onMsg(msg) {
      const tid = msg.ticketId?.toString?.() || msg.ticketId;
      if (tid === activeTicket?._id?.toString()) {
        setMessages(prev => [...prev, msg]);
        if (msg.ticket?.status) setActiveTicket(t => ({ ...t, status: msg.ticket.status }));
      }
      setTickets(prev => prev.map(t => {
        const match = t._id?.toString() === tid || t._id === tid;
        if (!match) return t;
        const isActive = t._id?.toString() === activeTicket?._id?.toString();
        return { ...t, lastMessage: msg.content || "[Hình ảnh]", lastMessageAt: msg.createdAt,
          unreadByStaff: isActive ? 0 : (t.unreadByStaff || 0) + 1 };
      }));
    }
    function onTyping({ senderName }) { setTyping(senderName || "User"); }
    function onStopTyping() { setTyping(false); }
    function onStatusChange({ ticketId, status }) {
      if (ticketId === activeTicket?._id?.toString()) setActiveTicket(t => ({ ...t, status }));
      setTickets(prev => prev.map(t => t._id?.toString() === ticketId?.toString() ? { ...t, status } : t));
    }
    socket.on("support_message",       onMsg);
    socket.on("support_typing",        onTyping);
    socket.on("support_stop_typing",   onStopTyping);
    socket.on("support_status_change", onStatusChange);
    return () => {
      socket.off("support_message",       onMsg);
      socket.off("support_typing",        onTyping);
      socket.off("support_stop_typing",   onStopTyping);
      socket.off("support_status_change", onStatusChange);
    };
  }, [activeTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleInputChange(e) {
    setInput(e.target.value);
    const socket = getSocket();
    if (activeTicket && socket) {
      socket.emit("support_typing", { ticketId: activeTicket._id });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit("support_stop_typing", { ticketId: activeTicket._id }), 1500);
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
      const res = await apiStaffSendMessage(activeTicket._id, fd);
      if (res.success) {
        setMessages(prev => [...prev, res.data.message]);
        if (["new", "pending"].includes(activeTicket.status)) {
          setActiveTicket(t => ({ ...t, status: "in_progress" }));
          setTickets(prev => prev.map(t => t._id === activeTicket._id ? { ...t, status: "in_progress" } : t));
        }
        setTickets(prev => prev.map(t => t._id === activeTicket._id
          ? { ...t, lastMessage: input.trim() || "[Hình ảnh]", lastMessageAt: new Date().toISOString() }
          : t));
        setInput("");
        setImageFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally { setSending(false); }
  }

  async function handleStatus(status) {
    if (!activeTicket) return;
    const res = await apiStaffUpdateStatus(activeTicket._id, status);
    if (res.success) {
      setActiveTicket(t => ({ ...t, status }));
      setTickets(prev => prev.map(t => t._id === activeTicket._id ? { ...t, status } : t));
    }
  }

  async function handlePriority(priority) {
    if (!activeTicket) return;
    const res = await apiStaffUpdatePriority(activeTicket._id, priority);
    if (res.success) {
      setActiveTicket(t => ({ ...t, priority }));
      setTickets(prev => prev.map(t => t._id === activeTicket._id ? { ...t, priority } : t));
    }
  }

  async function handleAssignMe() {
    if (!activeTicket) return;
    const res = await apiStaffAssign(activeTicket._id);
    if (res.success) setActiveTicket(t => ({ ...t, assignedTo: res.data.ticket.assignedTo }));
  }

  const currentUserId = currentUser?._id?.toString() || currentUser?.id;

  const statCards = [
    { key: "newCount",        label: "Mới",          color: "#1d4ed8" },
    { key: "pendingCount",    label: "Chờ xử lý",    color: "#d97706" },
    { key: "inProgressCount", label: "Đang xử lý",   color: "#7c3aed" },
    { key: "waitingCount",    label: "Chờ KH",       color: "#0891b2" },
    { key: "resolvedCount",   label: "Đã giải quyết",color: "#16a34a" },
  ];

  return (
    <div className="ss-page">

      {/* ── Stats ── */}
      <div className="ss-stats">
        {statCards.map(sc => (
          <div key={sc.key} className="ss-stat-card"
            style={{ borderTop: `3px solid ${sc.color}`, cursor: "pointer" }}
            onClick={() => { setFStatus(sc.key === "newCount" ? "new" : sc.key === "pendingCount" ? "pending" : sc.key === "inProgressCount" ? "in_progress" : sc.key === "waitingCount" ? "waiting_customer" : "resolved"); }}>
            <p className="ss-stat-val" style={{ color: sc.color }}>{stats[sc.key] ?? 0}</p>
            <p className="ss-stat-lbl">{sc.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className="ss-layout">

        {/* ── Ticket list pane ── */}
        <div className={`ss-list-pane ${mobilePane === "chat" ? "ss-hidden-mobile" : ""}`}>

          {/* Filters */}
          <div className="ss-filters">
            <input className="ss-search" placeholder="Tìm tiêu đề, user..."
              value={fSearch} onChange={e => setFSearch(e.target.value)} />
            <div className="ss-filter-row">
              <select className="ss-sel" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                <option value="">Tất cả</option>
                {Object.entries(STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="ss-sel" value={fPriority} onChange={e => setFPriority(e.target.value)}>
                <option value="">Ưu tiên</option>
                {Object.entries(PRIORITIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="ss-sel" value={fTopic} onChange={e => setFTopic(e.target.value)}>
                <option value="">Chủ đề</option>
                {Object.entries(TOPICS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="ss-sel" value={fAssigned} onChange={e => setFAssigned(e.target.value)}>
                <option value="">Tất cả NV</option>
                <option value="me">Của tôi</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="ss-list">
            {tickets.length === 0 ? (
              <div className="ss-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <p>Không có yêu cầu nào</p>
              </div>
            ) : tickets.map(t => (
              <div key={t._id}
                className={`ss-ticket-row ${activeTicket?._id === t._id ? "active" : ""}`}
                onClick={() => openTicket(t)}>
                <div className="ss-ticket-row-top">
                  <span className={`ss-prio ${PRIORITIES[t.priority]?.cls}`}>
                    {PRIORITIES[t.priority]?.label}
                  </span>
                  <span className={`ss-status ${STATUSES[t.status]?.cls}`}>
                    {STATUSES[t.status]?.label}
                  </span>
                  {t.unreadByStaff > 0 && (
                    <span className="ss-unread">{t.unreadByStaff}</span>
                  )}
                  <span className="ss-time">{formatTime(t.lastMessageAt || t.createdAt)}</span>
                </div>
                <div className="ss-ticket-subject">{t.subject}</div>
                <div className="ss-ticket-meta">
                  <span className="ss-topic-chip" style={{ color: TOPICS[t.topic]?.color }}>
                    {TOPICS[t.topic]?.label}
                  </span>
                  <span className="ss-user-name">
                    {t.userId?.name || "–"}
                  </span>
                </div>
                {t.lastMessage && (
                  <div className="ss-last-msg">{t.lastMessage}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat pane ── */}
        <div className={`ss-chat-pane ${mobilePane === "list" ? "ss-hidden-mobile" : ""}`}>
          {!activeTicket ? (
            <div className="ss-chat-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <h3>Chọn yêu cầu hỗ trợ</h3>
              <p>Chọn một yêu cầu từ danh sách để xem và trả lời</p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="ss-chat-header">
                <button className="ss-back-btn" onClick={() => setMobilePane("list")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                </button>
                <div className="ss-chat-header-info">
                  <div className="ss-chat-header-top">
                    <strong className="ss-chat-subject">{activeTicket.subject}</strong>
                    <span className={`ss-status ${STATUSES[activeTicket.status]?.cls}`}>
                      {STATUSES[activeTicket.status]?.label}
                    </span>
                    <span className={`ss-prio ${PRIORITIES[activeTicket.priority]?.cls}`}>
                      {PRIORITIES[activeTicket.priority]?.label}
                    </span>
                  </div>
                  {activeTicket.userId && (
                    <div className="ss-chat-user-info">
                      👤 <strong>{activeTicket.userId.name}</strong>
                      <span>{activeTicket.userId.email}</span>
                      {activeTicket.assignedTo && (
                        <span className="ss-assigned">
                          → {activeTicket.assignedTo.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="ss-action-bar">
                <div className="ss-action-group">
                  <span className="ss-action-label">Trạng thái:</span>
                  {STATUS_ACTIONS
                    .filter(a => a.value !== activeTicket.status)
                    .map(a => (
                      <button key={a.value} className="ss-action-btn" onClick={() => handleStatus(a.value)}>
                        {a.label}
                      </button>
                    ))}
                </div>
                <div className="ss-action-group">
                  <span className="ss-action-label">Ưu tiên:</span>
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <button key={k}
                      className={`ss-prio-btn ${k === activeTicket.priority ? "active" : ""}`}
                      style={{ "--p-color": k === "low" ? "#16a34a" : k === "medium" ? "#d97706" : k === "high" ? "#dc2626" : "#7c2d12" }}
                      onClick={() => handlePriority(k)}>
                      {v.label}
                    </button>
                  ))}
                </div>
                {!activeTicket.assignedTo || activeTicket.assignedTo._id?.toString() !== currentUserId ? (
                  <button className="ss-assign-me-btn" onClick={handleAssignMe}>
                    Nhận xử lý
                  </button>
                ) : (
                  <span className="ss-assigned-me">Bạn đang xử lý</span>
                )}
              </div>

              {/* Messages */}
              <div className="ss-messages">
                {loadingMsgs ? (
                  <div className="ss-msg-loading">Đang tải...</div>
                ) : messages.length === 0 ? (
                  <div className="ss-msg-empty">Chưa có tin nhắn. Hãy trả lời người dùng!</div>
                ) : messages.map(msg => {
                  const isStaff = msg.senderRole === "admin";
                  return (
                    <div key={msg._id} className={`ss-msg ${isStaff ? "ss-msg-staff" : "ss-msg-user"}`}>
                      <div className="ss-msg-avatar">
                        {isStaff ? "🛡️" : (msg.senderId?.name?.charAt(0) || "?")}
                      </div>
                      <div className="ss-msg-body">
                        <div className="ss-msg-name">
                          {isStaff ? (msg.senderId?.name || "Support") : msg.senderId?.name}
                          <span className="ss-msg-time">{formatFull(msg.createdAt)}</span>
                        </div>
                        {msg.content && <div className="ss-msg-bubble">{msg.content}</div>}
                        {msg.image && (
                          <img src={resolveMediaUrl(msg.image)} alt="attachment"
                            className="ss-msg-img"
                            onClick={() => window.open(resolveMediaUrl(msg.image), "_blank")} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="ss-msg ss-msg-user">
                    <div className="ss-msg-avatar">{typeof typing === "string" ? typing.charAt(0) : "?"}</div>
                    <div className="ss-msg-body">
                      <div className="ss-msg-name">{typeof typing === "string" ? typing : "User"}</div>
                      <div className="ss-typing"><span/><span/><span/></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeTicket.status === "closed" ? (
                <div className="ss-closed-bar">Yêu cầu đã đóng.</div>
              ) : (
                <form className="ss-input-area" onSubmit={handleSend}>
                  {imageFile && (
                    <div className="ss-img-preview">
                      <img src={URL.createObjectURL(imageFile)} alt="" />
                      <button type="button" onClick={() => { setImageFile(null); if (fileRef.current) fileRef.current.value = ""; }}>✕</button>
                    </div>
                  )}
                  <div className="ss-input-row">
                    <button type="button" className="ss-attach" onClick={() => fileRef.current?.click()} title="Đính kèm ảnh">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setImageFile(e.target.files[0] || null)} />
                    <input className="ss-input"
                      placeholder="Trả lời người dùng..."
                      value={input} onChange={handleInputChange}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }} />
                    <button type="submit" className="ss-send" disabled={sending || (!input.trim() && !imageFile)}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
