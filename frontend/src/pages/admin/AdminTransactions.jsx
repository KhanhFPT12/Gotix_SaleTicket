import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  pending_payment:       { label: "Chờ thanh toán",  cls: "admin-badge-warning" },
  waiting_admin_confirm: { label: "Chờ xác nhận",    cls: "admin-badge-info"    },
  paid:                  { label: "Đã xác nhận",     cls: "admin-badge-success" },
  completed:             { label: "Hoàn thành",       cls: "admin-badge-success" },
  failed:                { label: "Thất bại",         cls: "admin-badge-error"   },
  expired:               { label: "Hết hạn",          cls: "admin-badge-error"   },
  // backwards-compat
  pending:               { label: "Chờ xử lý",       cls: "admin-badge-warning" },
  cancelled:             { label: "Đã hủy",           cls: "admin-badge-error"   },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminTransactions() {
  const { transactions, adminConfirmTx, adminRejectTx } = useTickets();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]             = useState("");
  const [processing, setProcessing]     = useState(null);

  const filtered = transactions
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .filter((t) =>
      !search ||
      (t.ticketTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").includes(search) ||
      (t.paymentNote || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.buyer?.name || "").toLowerCase().includes(search.toLowerCase())
    );

  const waiting = transactions.filter((t) => t.status === "waiting_admin_confirm");
  const completedTxs = transactions.filter((t) => t.status === "completed");
  const totalRevenue = completedTxs.reduce((s, t) => s + (t.amount || 0), 0);

  async function handleConfirm(txId) {
    setProcessing(txId);
    try { await adminConfirmTx(txId); }
    catch (e) { alert(e.message || "Xác nhận thất bại"); }
    finally { setProcessing(null); }
  }

  async function handleReject(txId) {
    if (!window.confirm("Từ chối giao dịch này?")) return;
    setProcessing(txId);
    try { await adminRejectTx(txId); }
    catch (e) { alert(e.message || "Từ chối thất bại"); }
    finally { setProcessing(null); }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Giao dịch</h1>
        <p className="admin-page-subtitle">Theo dõi và xác nhận toàn bộ giao dịch</p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng giao dịch</p>
          <p className="admin-stat-value">{transactions.length}</p>
        </div>
        <div className="admin-stat-card" style={{ borderTop: waiting.length > 0 ? "3px solid #f59e0b" : undefined }}>
          <p className="admin-stat-label">Chờ xác nhận</p>
          <p className="admin-stat-value" style={{ color: waiting.length > 0 ? "#d97706" : undefined }}>
            {waiting.length}
          </p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Hoàn thành</p>
          <p className="admin-stat-value">{completedTxs.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng doanh thu</p>
          <p className="admin-stat-value" style={{ fontSize: 18 }}>{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Danh sách giao dịch</span>
          <div className="admin-section-actions">
            <input
              className="admin-search"
              placeholder="Tìm mã GD, tên vé, nội dung CK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-search"
              style={{ minWidth: 160 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="waiting_admin_confirm">Chờ xác nhận</option>
              <option value="pending_payment">Chờ thanh toán</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">Không có giao dịch nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Vé</th>
                  <th>Người mua</th>
                  <th>Nội dung CK</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>
                      #{tx.id?.slice(-8)}
                    </td>
                    <td>
                      <div className="admin-cell-main">{tx.ticketTitle || "–"}</div>
                    </td>
                    <td>
                      <div className="admin-cell-main">{tx.buyer?.name || "–"}</div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "monospace",
                        background: "#f1f5f9",
                        padding: "2px 7px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {tx.paymentNote || "–"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(tx.amount)}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(tx.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${STATUS_CONFIG[tx.status]?.cls || "admin-badge-warning"}`}>
                        {STATUS_CONFIG[tx.status]?.label || tx.status}
                      </span>
                    </td>
                    <td>
                      {tx.status === "waiting_admin_confirm" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            onClick={() => handleConfirm(tx.id)}
                            disabled={processing === tx.id}
                          >
                            {processing === tx.id ? "..." : "Xác nhận"}
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            onClick={() => handleReject(tx.id)}
                            disabled={processing === tx.id}
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
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
