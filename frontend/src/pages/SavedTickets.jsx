import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetMyFavorites, apiUnfavorite, normalizeTicket } from "../api/client";
import TicketCard from "../components/tickets/TicketCard";

export default function SavedTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await apiGetMyFavorites();
    if (res.success) setTickets((res.data.tickets || []).map(normalizeTicket));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUnfavorite(ticketId) {
    await apiUnfavorite(ticketId);
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  }

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vé đã lưu</h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>{tickets.length} vé đang lưu</p>
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Đang tải...</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", marginBottom: 16 }}>Bạn chưa lưu vé nào.</p>
          <Link to="/tickets" className="btn btn-primary">Khám phá vé</Link>
        </div>
      ) : (
        <div className="ticket-grid">
          {tickets.map(t => (
            <div key={t.id} style={{ position: "relative" }}>
              <TicketCard ticket={t} />
              <button
                onClick={() => handleUnfavorite(t.id)}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "#fff", border: "1px solid #e2e8f0",
                  borderRadius: 6, padding: "4px 8px",
                  fontSize: 12, cursor: "pointer", color: "#ef4444",
                }}
              >
                Bỏ lưu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
