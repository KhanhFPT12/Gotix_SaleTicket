import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  pending:  { label: "Chờ xử lý", cls: "admin-badge-warning" },
  resolved: { label: "Đã xử lý",  cls: "admin-badge-success" },
  dismissed:{ label: "Bỏ qua",    cls: "admin-badge-neutral" },
};

const REASON_LABELS = {
  "Nghi ngờ vé giả":   "Vé giả",
  "Seller lừa đảo":    "Lừa đảo",
  "Nội dung không phù hợp": "Nội dung xấu",
};

export default function AdminReports() {
  const { reports, resolveReport } = useTickets();
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = reports.filter(
    (r) => filterStatus === "all" || r.status === filterStatus
  );

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Báo cáo</h1>
        <p className="admin-page-subtitle">Xử lý các báo cáo vi phạm từ người dùng</p>
      </div>

      <div className="admin-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng báo cáo</p>
          <p className="admin-stat-value">{reports.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Chờ xử lý</p>
          <p className="admin-stat-value" style={{ color: pendingCount > 0 ? "#c2410c" : undefined }}>
            {pendingCount}
          </p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Đã xử lý</p>
          <p className="admin-stat-value">{reports.filter((r) => r.status !== "pending").length}</p>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">
            Danh sách báo cáo
            {pendingCount > 0 && (
              <span className="admin-badge admin-badge-warning" style={{ marginLeft: 8 }}>
                {pendingCount} chờ xử lý
              </span>
            )}
          </span>
          <div className="admin-section-actions">
            <select
              className="admin-search"
              style={{ minWidth: 150 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả ({reports.length})</option>
              <option value="pending">Chờ xử lý ({pendingCount})</option>
              <option value="resolved">Đã xử lý ({reports.filter(r => r.status === "resolved").length})</option>
              <option value="dismissed">Bỏ qua ({reports.filter(r => r.status === "dismissed").length})</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">Không có báo cáo nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người báo cáo</th>
                  <th>Vé bị báo cáo</th>
                  <th>Lý do</th>
                  <th>Mô tả</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rp) => (
                    <tr key={rp.id}>
                      <td>
                        <div className="admin-cell-main">{rp.reporter?.name || "–"}</div>
                        <div className="admin-cell-sub">{rp.reporter?.email}</div>
                      </td>
                      <td>
                        <div className="admin-cell-main">{rp.ticketTitle || rp.ticketId}</div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-error">
                          {REASON_LABELS[rp.reason] || rp.reason}
                        </span>
                      </td>
                      <td style={{ color: "#6b7280", maxWidth: 260, whiteSpace: "normal" }}>
                        {rp.description}
                      </td>
                      <td style={{ color: "#6b7280" }}>{rp.createdAt}</td>
                      <td>
                        <span className={`admin-badge ${STATUS_CONFIG[rp.status]?.cls}`}>
                          {STATUS_CONFIG[rp.status]?.label}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          {rp.status === "pending" && (
                            <>
                              <button
                                className="admin-btn admin-btn-reject"
                                onClick={() => resolveReport(rp.id, "resolved")}
                              >
                                Xử lý
                              </button>
                              <button
                                className="admin-btn admin-btn-neutral"
                                onClick={() => resolveReport(rp.id, "dismissed")}
                              >
                                Bỏ qua
                              </button>
                            </>
                          )}
                          {rp.status !== "pending" && (
                            <button
                              className="admin-btn admin-btn-neutral"
                              onClick={() => resolveReport(rp.id, "pending")}
                            >
                              Mở lại
                            </button>
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
