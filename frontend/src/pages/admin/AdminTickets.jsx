import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  approved: { label: "Đã duyệt", cls: "admin-badge-success" },
  pending:  { label: "Chờ duyệt", cls: "admin-badge-warning" },
  rejected: { label: "Từ chối",   cls: "admin-badge-error"   },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminTickets() {
  const { tickets, updateTicketStatus } = useTickets();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = tickets
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (t.movieTitle || t.title || "").toLowerCase().includes(q) ||
        (t.cinema     || t.location || "").toLowerCase().includes(q) ||
        (t.city       || "").toLowerCase().includes(q) ||
        (t.sellerName || "").toLowerCase().includes(q)
      );
    });

  const pendingCount = tickets.filter(t => t.status === "pending").length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý vé phim</h1>
        <p className="admin-page-subtitle">Duyệt và quản lý toàn bộ vé phim đăng trên hệ thống</p>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">
            Danh sách vé phim
            {pendingCount > 0 && (
              <span className="admin-badge admin-badge-warning" style={{ marginLeft: 8 }}>
                {pendingCount} chờ duyệt
              </span>
            )}
          </span>
          <div className="admin-section-actions">
            <input
              className="admin-search"
              placeholder="Tìm tên phim, rạp, khu vực..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="admin-search"
              style={{ minWidth: 160 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả ({tickets.length})</option>
              <option value="pending">Chờ duyệt ({tickets.filter(t => t.status === "pending").length})</option>
              <option value="approved">Đã duyệt ({tickets.filter(t => t.status === "approved").length})</option>
              <option value="rejected">Từ chối ({tickets.filter(t => t.status === "rejected").length})</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">Không có vé phim nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên phim</th>
                  <th>Rạp & Khu vực</th>
                  <th>Suất chiếu</th>
                  <th>Người đăng</th>
                  <th>Giá pass</th>
                  <th>Ngày đăng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="admin-cell-main">{t.movieTitle || t.title || "–"}</div>
                      {(t.room || (t.seats && t.seats.length > 0)) && (
                        <div className="admin-cell-sub">
                          {[t.room, (t.seats || []).join(", ")].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin-cell-main">{t.cinema || t.location || "–"}</div>
                      {t.city && <div className="admin-cell-sub">{t.city}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>
                      {t.date ? formatDate(t.date) : "–"}
                      {t.time ? <><br />{t.time}</> : ""}
                    </td>
                    <td>
                      <div className="admin-cell-main">{t.sellerName || "–"}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(t.passPrice)}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{t.createdAt ? formatDate(t.createdAt) : "–"}</td>
                    <td>
                      <span className={`admin-badge ${STATUS_CONFIG[t.status]?.cls || "admin-badge-warning"}`}>
                        {STATUS_CONFIG[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-btns">
                        {t.status === "pending" && (
                          <>
                            <button className="admin-btn admin-btn-approve" onClick={() => updateTicketStatus(t.id, "approved")}>Duyệt</button>
                            <button className="admin-btn admin-btn-reject"  onClick={() => updateTicketStatus(t.id, "rejected")}>Từ chối</button>
                          </>
                        )}
                        {t.status === "approved" && (
                          <button className="admin-btn admin-btn-reject" onClick={() => updateTicketStatus(t.id, "rejected")}>Thu hồi</button>
                        )}
                        {t.status === "rejected" && (
                          <button className="admin-btn admin-btn-approve" onClick={() => updateTicketStatus(t.id, "approved")}>Kích hoạt</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
