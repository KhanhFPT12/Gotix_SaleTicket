import { useState, useEffect } from "react";
import { apiGet, apiPatch, normalizeWithdrawal } from "../../api/client";
import "../../layouts/AdminLayout.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CFG = {
  pending:  { label: "Chờ duyệt", cls: "admin-badge-warning" },
  approved: { label: "Đã duyệt",  cls: "admin-badge-success" },
  rejected: { label: "Từ chối",   cls: "admin-badge-error"   },
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setFilter]     = useState("pending");
  const [processing, setProcessing]   = useState(null);
  const [noteMap, setNoteMap]         = useState({});

  async function load() {
    setLoading(true);
    const res = await apiGet(`/admin/withdrawals?status=${statusFilter}&limit=100`);
    if (res.success) setWithdrawals((res.data.withdrawals || []).map(normalizeWithdrawal));
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleAction(id, action) {
    try {
      setProcessing(id + action);
      const note = noteMap[id] || "";
      const res = await apiPatch(`/admin/withdrawals/${id}/${action}`, { adminNote: note });
      if (res.success) {
        setWithdrawals(prev => prev.map(w =>
          w.id === id ? normalizeWithdrawal(res.data.withdrawal) : w
        ));
      } else {
        alert(res.message || "Thao tác thất bại");
      }
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Yêu cầu rút tiền</h1>
        <p className="admin-page-subtitle">Duyệt hoặc từ chối yêu cầu rút tiền của người dùng</p>
      </div>

      {pendingCount > 0 && statusFilter === "pending" && (
        <div className="admin-alert-row">
          <div className="admin-alert-box warn">
            <span>Có <strong>{pendingCount} yêu cầu</strong> đang chờ xử lý</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="admin-section" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["pending", "approved", "rejected"].map(s => (
            <button
              key={s}
              className={`admin-btn ${statusFilter === s ? "admin-btn-primary" : "admin-btn-neutral"}`}
              onClick={() => setFilter(s)}
            >
              {STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-section">
        {loading ? (
          <div className="admin-empty">Đang tải...</div>
        ) : withdrawals.length === 0 ? (
          <div className="admin-empty">Không có yêu cầu nào.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Số tiền</th>
                <th>Ngân hàng</th>
                <th>Số TK / Chủ TK</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                {statusFilter === "pending" && <th>Ghi chú / Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(wd => (
                <tr key={wd.id}>
                  <td>
                    <div className="admin-cell-main">{wd.user?.name ?? "—"}</div>
                    <div className="admin-cell-sub">{wd.user?.email ?? ""}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatPrice(wd.amount)}</td>
                  <td>{wd.bankName}</td>
                  <td>
                    <div className="admin-cell-main">{wd.bankAccount}</div>
                    <div className="admin-cell-sub">{wd.bankAccountName}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${STATUS_CFG[wd.status]?.cls}`}>
                      {STATUS_CFG[wd.status]?.label}
                    </span>
                    {wd.adminNote && (
                      <div className="admin-cell-sub" style={{ marginTop: 2 }}>{wd.adminNote}</div>
                    )}
                  </td>
                  <td className="admin-cell-sub">{formatDate(wd.createdAt)}</td>
                  {statusFilter === "pending" && (
                    <td>
                      {wd.status === "pending" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <input
                            type="text"
                            className="admin-input-sm"
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={noteMap[wd.id] || ""}
                            onChange={e => setNoteMap(m => ({ ...m, [wd.id]: e.target.value }))}
                          />
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              disabled={processing === wd.id + "approve"}
                              onClick={() => handleAction(wd.id, "approve")}
                            >
                              {processing === wd.id + "approve" ? "..." : "Duyệt"}
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              disabled={processing === wd.id + "reject"}
                              onClick={() => handleAction(wd.id, "reject")}
                            >
                              {processing === wd.id + "reject" ? "..." : "Từ chối"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="admin-cell-sub">Đã xử lý</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
