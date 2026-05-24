import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  completed: { label: "Hoàn thành", cls: "admin-badge-success" },
  pending:   { label: "Chờ xử lý", cls: "admin-badge-warning" },
  cancelled: { label: "Đã hủy",    cls: "admin-badge-error" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function AdminTransactions() {
  const { transactions } = useTickets();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = transactions
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .filter((t) =>
      !search ||
      t.ticketTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search)
    );

  const completedTxs = transactions.filter((t) => t.status === "completed");
  const totalRevenue = completedTxs.reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Giao dịch</h1>
        <p className="admin-page-subtitle">Theo dõi toàn bộ giao dịch trên hệ thống</p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng giao dịch</p>
          <p className="admin-stat-value">{transactions.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Hoàn thành</p>
          <p className="admin-stat-value">{completedTxs.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Đang chờ</p>
          <p className="admin-stat-value">{transactions.filter(t => t.status === "pending").length}</p>
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
              placeholder="Tìm mã GD, tên vé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-search"
              style={{ minWidth: 140 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="completed">Hoàn thành</option>
              <option value="pending">Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
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
                  <th>Người bán</th>
                  <th>Số tiền</th>
                  <th>Thanh toán</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>#{tx.id}</td>
                      <td>
                        <div className="admin-cell-main">{tx.ticketTitle}</div>
                      </td>
                      <td>
                        <div className="admin-cell-main">{tx.buyer?.name || "–"}</div>
                      </td>
                      <td>
                        <div className="admin-cell-main">{tx.seller?.name || "–"}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(tx.amount)}</td>
                      <td style={{ color: "#6b7280" }}>
                        {tx.paymentMethod === "momo" ? "Momo" : tx.paymentMethod === "vnpay" ? "VNPay" : "CK ngân hàng"}
                      </td>
                      <td style={{ color: "#6b7280" }}>{tx.createdAt}</td>
                      <td>
                        <span className={`admin-badge ${STATUS_CONFIG[tx.status]?.cls}`}>
                          {STATUS_CONFIG[tx.status]?.label}
                        </span>
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
