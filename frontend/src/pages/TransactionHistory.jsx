import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../context/TicketContext";
import "./TransactionHistory.css";

const STATUS_LABELS = {
  completed: { label: "Hoàn thành", cls: "badge-success" },
  pending: { label: "Chờ xử lý", cls: "badge-warning" },
  cancelled: { label: "Đã hủy", cls: "badge-error" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function TransactionHistory() {
  const { currentUser } = useAuth();
  const { transactions } = useTickets();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const isSeller = currentUser?.role === "seller";

  const myTxs = transactions.filter(
    (t) => t.buyerId === currentUser?.id || t.sellerId === currentUser?.id
  );

  const filtered = myTxs.filter((t) => {
    if (activeTab === "buy") return t.buyerId === currentUser?.id;
    if (activeTab === "sell") return t.sellerId === currentUser?.id;
    return true;
  }).filter(
    (t) =>
      !search ||
      t.ticketTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search)
  );

  return (
    <div className="tx-history-page">
      <div className="container">
        <h1 className="page-heading">Lịch sử giao dịch</h1>

        <div className="tx-toolbar">
          <div className="tabs-inline">
            <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              Tất cả ({myTxs.length})
            </button>
            <button className={`tab-btn ${activeTab === "buy" ? "active" : ""}`} onClick={() => setActiveTab("buy")}>
              Đã mua ({myTxs.filter(t => t.buyerId === currentUser?.id).length})
            </button>
            {isSeller && (
              <button className={`tab-btn ${activeTab === "sell" ? "active" : ""}`} onClick={() => setActiveTab("sell")}>
                Đã bán ({myTxs.filter(t => t.sellerId === currentUser?.id).length})
              </button>
            )}
          </div>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: 240 }}
            placeholder="Tìm theo tên vé, mã GD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tx-table-wrap card">
          {filtered.length === 0 ? (
            <div className="empty-box">Không có giao dịch nào.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Vé</th>
                  <th>Loại</th>
                  <th>Số tiền</th>
                  <th>Thanh toán</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-sm text-secondary">#{tx.id}</td>
                    <td>
                      <div className="tx-title">{tx.ticketTitle}</div>
                    </td>
                    <td>
                      <span className={`badge ${tx.buyerId === currentUser?.id ? "badge-info" : "badge-success"}`}>
                        {tx.buyerId === currentUser?.id ? "Mua" : "Bán"}
                      </span>
                    </td>
                    <td className="font-semibold">{formatPrice(tx.amount)}</td>
                    <td className="text-sm text-secondary">
                      {tx.paymentMethod === "momo" ? "Momo" : "Chuyển khoản"}
                    </td>
                    <td className="text-sm text-secondary">{tx.createdAt}</td>
                    <td>
                      <span className={`badge ${STATUS_LABELS[tx.status]?.cls}`}>
                        {STATUS_LABELS[tx.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
