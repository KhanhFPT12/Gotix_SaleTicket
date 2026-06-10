import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  approved: { label: "Đã duyệt", cls: "admin-badge-success" },
  pending:  { label: "Chờ duyệt", cls: "admin-badge-warning" },
  rejected: { label: "Từ chối",   cls: "admin-badge-error"   },
  sold:     { label: "Đã bán",     cls: "admin-badge-info"    },
  revoked:  { label: "Đã thu hồi", cls: "admin-badge-neutral" },
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // States for handling reject/revoke reasons
  const [showReasonInput, setShowReasonInput] = useState(""); // "reject" or "revoke" or ""
  const [reasonText, setReasonText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleModalClose = () => {
    setSelectedTicket(null);
    setShowReasonInput("");
    setReasonText("");
  };

  const handleApprove = async (ticketId) => {
    setActionLoading(true);
    try {
      await updateTicketStatus(ticketId, "approved");
      handleModalClose();
    } catch (err) {
      alert(err.message || "Lỗi phê duyệt vé");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (ticketId) => {
    if (!reasonText.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    setActionLoading(true);
    try {
      await updateTicketStatus(ticketId, "rejected", reasonText);
      handleModalClose();
    } catch (err) {
      alert(err.message || "Lỗi từ chối vé");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (ticketId) => {
    if (!reasonText.trim()) {
      alert("Vui lòng nhập lý do thu hồi!");
      return;
    }
    setActionLoading(true);
    try {
      await updateTicketStatus(ticketId, "revoked", reasonText);
      handleModalClose();
    } catch (err) {
      alert(err.message || "Lỗi thu hồi vé");
    } finally {
      setActionLoading(false);
    }
  };

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
              <option value="sold">Đã bán ({tickets.filter(t => t.status === "sold").length})</option>
              <option value="revoked">Đã thu hồi ({tickets.filter(t => t.status === "revoked").length})</option>
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
                    <td>
                      <span className={`admin-badge ${STATUS_CONFIG[t.status]?.cls || "admin-badge-warning"}`}>
                        {STATUS_CONFIG[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-btns">
                        <button className="admin-btn admin-btn-neutral admin-btn-sm" onClick={() => setSelectedTicket(t)}>
                          Chi tiết
                        </button>
                        {t.status === "pending" && (
                          <>
                            <button className="admin-btn admin-btn-approve admin-btn-sm" onClick={() => handleApprove(t.id)}>Duyệt</button>
                          </>
                        )}
                        {t.status === "approved" && (
                          <button className="admin-btn admin-btn-reject admin-btn-sm" onClick={() => {
                            setSelectedTicket(t);
                            setShowReasonInput("revoke");
                          }}>Thu hồi</button>
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

      {/* ── Ticket Detail Modal for Admin ── */}
      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && handleModalClose()}>
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Chi tiết vé phim #{selectedTicket.id}</h3>
              <button className="admin-modal-close" onClick={handleModalClose}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-grid-2">
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Tên phim</div>
                  <div className="admin-modal-field-value" style={{ fontSize: 16, fontWeight: 700 }}>
                    {selectedTicket.movieTitle || selectedTicket.title || "–"}
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Trạng thái</div>
                  <div>
                    <span className={`admin-badge ${STATUS_CONFIG[selectedTicket.status]?.cls || "admin-badge-warning"}`}>
                      {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                    </span>
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Tên rạp</div>
                  <div className="admin-modal-field-value">{selectedTicket.cinema || selectedTicket.location || "–"}</div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Khu vực / Địa chỉ</div>
                  <div className="admin-modal-field-value">
                    {[selectedTicket.city, selectedTicket.cinemaAddress].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Suất chiếu</div>
                  <div className="admin-modal-field-value">
                    {[selectedTicket.date ? formatDate(selectedTicket.date) : "", selectedTicket.time].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Phòng / Ghế</div>
                  <div className="admin-modal-field-value">
                    {[selectedTicket.room ? `Phòng ${selectedTicket.room}` : "", selectedTicket.seats && selectedTicket.seats.length > 0 ? `Ghế ${(selectedTicket.seats || []).join(", ")}` : ""].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Số lượng vé</div>
                  <div className="admin-modal-field-value">{selectedTicket.quantity} vé</div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Giá (Pass / Gốc)</div>
                  <div className="admin-modal-field-value">
                    <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>{formatPrice(selectedTicket.passPrice)}</span>
                    <span style={{ textDecoration: "line-through", color: "#9ca3af", marginLeft: 8, fontSize: 12 }}>
                      {formatPrice(selectedTicket.originalPrice)}
                    </span>
                  </div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Người bán</div>
                  <div className="admin-modal-field-value">{selectedTicket.sellerName || "–"}</div>
                </div>
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Ngày đăng</div>
                  <div className="admin-modal-field-value">{selectedTicket.createdAt ? formatDate(selectedTicket.createdAt) : "–"}</div>
                </div>
              </div>

              {selectedTicket.description && (
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label">Mô tả của người bán</div>
                  <div className="admin-modal-field-value desc">{selectedTicket.description}</div>
                </div>
              )}

              {selectedTicket.adminNote && (
                <div className="admin-modal-field">
                  <div className="admin-modal-field-label" style={{ color: "var(--color-error)" }}>Ghi chú của Admin / Lý do xử lý</div>
                  <div className="admin-modal-field-value desc" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
                    {selectedTicket.adminNote}
                  </div>
                </div>
              )}

              {/* Photos Section */}
              <div className="admin-modal-field">
                <div className="admin-modal-field-label">Ảnh đính kèm từ người bán (Chỉ Admin mới xem được)</div>
                <div className="admin-modal-images">
                  <div className="admin-image-card">
                    <div className="admin-image-card-title">Ảnh vé thực tế</div>
                    <div className="admin-image-card-body">
                      {selectedTicket.images?.[0] ? (
                        <img src={selectedTicket.images[0]} alt="Ảnh vé" onClick={() => window.open(selectedTicket.images[0])} />
                      ) : (
                        <div className="admin-image-placeholder">Không có ảnh vé</div>
                      )}
                    </div>
                  </div>
                  <div className="admin-image-card">
                    <div className="admin-image-card-title">Mã QR vé vào rạp</div>
                    <div className="admin-image-card-body">
                      {selectedTicket.images?.[1] ? (
                        <img src={selectedTicket.images[1]} alt="Mã QR" onClick={() => window.open(selectedTicket.images[1])} />
                      ) : (
                        <div className="admin-image-placeholder">Không có ảnh QR</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input for Reject/Revoke reasons */}
              {showReasonInput && (
                <div style={{ marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                  <label className="admin-modal-field-label" style={{ color: "var(--color-error)" }}>
                    Lý do {showReasonInput === "reject" ? "từ chối" : "thu hồi"} vé <span style={{ color: "red" }}>*</span>
                  </label>
                  <textarea
                    className="admin-textarea-reason"
                    placeholder={`Nhập lý do chi tiết để gửi cho người bán...`}
                    value={reasonText}
                    onChange={e => setReasonText(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                    <button className="admin-btn admin-btn-neutral" onClick={() => { setShowReasonInput(""); setReasonText(""); }}>
                      Hủy thao tác
                    </button>
                    {showReasonInput === "reject" ? (
                      <button className="admin-btn admin-btn-danger" disabled={actionLoading} onClick={() => handleReject(selectedTicket.id)}>
                        {actionLoading ? "Đang gửi..." : "Xác nhận từ chối"}
                      </button>
                    ) : (
                      <button className="admin-btn admin-btn-danger" disabled={actionLoading} onClick={() => handleRevoke(selectedTicket.id)}>
                        {actionLoading ? "Đang gửi..." : "Xác nhận thu hồi"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Main Actions) */}
            {!showReasonInput && (
              <div className="admin-modal-actions-bar">
                {selectedTicket.status === "pending" && (
                  <>
                    <button className="admin-btn admin-btn-reject" onClick={() => setShowReasonInput("reject")}>
                      Từ chối vé
                    </button>
                    <button className="admin-btn admin-btn-approve" style={{ minWidth: 100 }} onClick={() => handleApprove(selectedTicket.id)}>
                      Duyệt vé
                    </button>
                  </>
                )}
                {selectedTicket.status === "approved" && (
                  <button className="admin-btn admin-btn-danger" onClick={() => setShowReasonInput("revoke")}>
                    Thu hồi vé
                  </button>
                )}
                {(selectedTicket.status === "rejected" || selectedTicket.status === "revoked") && (
                  <button className="admin-btn admin-btn-approve" onClick={() => handleApprove(selectedTicket.id)}>
                    Duyệt lại (Kích hoạt)
                  </button>
                )}
                <button className="admin-btn admin-btn-neutral" onClick={handleModalClose}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
