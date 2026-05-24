import { useState, useEffect } from "react";
import { apiGet, apiPatch, normalizeTopUp } from "../../api/client";
import "../../layouts/AdminLayout.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CFG = {
  pending:  { label: "Chờ duyệt", cls: "admin-badge-warning" },
  approved: { label: "Đã duyệt",  cls: "admin-badge-success" },
  rejected: { label: "Từ chối",   cls: "admin-badge-error"   },
};

export default function AdminTopUps() {
  const [topUps, setTopUps]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setFilter]   = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap]       = useState({});

  async function load() {
    setLoading(true);
    const res = await apiGet(`/admin/topups?status=${statusFilter}&limit=100`);
    if (res.success) setTopUps((res.data.topUps || []).map(normalizeTopUp));
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleAction(id, action) {
    try {
      setProcessing(id + action);
      const note = noteMap[id] || "";
      const res = await apiPatch(`/admin/topups/${id}/${action}`, { adminNote: note });
      if (res.success) {
        setTopUps(prev => prev.map(t =>
          t.id === id ? normalizeTopUp(res.data.topUp) : t
        ));
      } else {
        alert(res.message || "Thao tác thất bại");
      }
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = topUps.filter(t => t.status === "pending").length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Lệnh nạp tiền</h1>
        <p className="admin-page-subtitle">
          Xác minh chuyển khoản và duyệt lệnh nạp — hệ thống tự động cộng tiền sau khi duyệt.
        </p>
      </div>

      {pendingCount > 0 && statusFilter === "pending" && (
        <div className="admin-alert-row">
          <div className="admin-alert-box warn">
            <span>Có <strong>{pendingCount} lệnh nạp</strong> đang chờ xác minh</span>
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
        ) : topUps.length === 0 ? (
          <div className="admin-empty">Không có lệnh nạp nào.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Mã lệnh</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                {statusFilter === "pending" && <th>Ghi chú / Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {topUps.map(tu => (
                <tr key={tu.id}>
                  <td>
                    <div className="admin-cell-main">{tu.user?.name ?? "—"}</div>
                    <div className="admin-cell-sub">{tu.user?.email ?? ""}</div>
                  </td>
                  <td>
                    <code style={{ fontFamily: "monospace", fontSize: 12, background: "#F1F5F9", padding: "2px 6px", borderRadius: 3 }}>
                      {tu.transferCode}
                    </code>
                  </td>
                  <td style={{ fontWeight: 700, color: "#16a34a" }}>+{formatPrice(tu.amount)}</td>
                  <td>
                    <span className={`admin-badge ${STATUS_CFG[tu.status]?.cls}`}>
                      {STATUS_CFG[tu.status]?.label}
                    </span>
                    {tu.adminNote && (
                      <div className="admin-cell-sub" style={{ marginTop: 2 }}>{tu.adminNote}</div>
                    )}
                  </td>
                  <td className="admin-cell-sub">{formatDate(tu.createdAt)}</td>
                  {statusFilter === "pending" && (
                    <td>
                      {tu.status === "pending" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <input
                            type="text"
                            className="admin-input-sm"
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={noteMap[tu.id] || ""}
                            onChange={e => setNoteMap(m => ({ ...m, [tu.id]: e.target.value }))}
                          />
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              disabled={processing === tu.id + "approve"}
                              onClick={() => handleAction(tu.id, "approve")}
                            >
                              {processing === tu.id + "approve" ? "..." : "Duyệt & Cộng tiền"}
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              disabled={processing === tu.id + "reject"}
                              onClick={() => handleAction(tu.id, "reject")}
                            >
                              {processing === tu.id + "reject" ? "..." : "Từ chối"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="admin-cell-sub">Đã xử lý · {formatDate(tu.processedAt)}</span>
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
