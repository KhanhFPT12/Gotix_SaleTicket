import { useState, useEffect } from "react";
import { apiGet, apiPatch } from "../../api/client";
import "../../layouts/AdminLayout.css";

const STATUS_CONFIG = {
  pending_payment:       { label: "Chờ thanh toán",  cls: "admin-badge-warning" },
  waiting_admin_confirm: { label: "Chờ xác nhận",    cls: "admin-badge-info"    },
  paid:                  { label: "Đã xác nhận",     cls: "admin-badge-success" },
  failed:                { label: "Thất bại",         cls: "admin-badge-error"   },
  expired:               { label: "Hết hạn",          cls: "admin-badge-error"   },
};

const PLAN_LABELS = {
  "1_month":  "1 Tháng",
  "3_months": "3 Tháng",
  "6_months": "6 Tháng",
  "1_year":   "1 Năm",
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

export default function AdminProSubscriptions() {
  const [subs, setSubs]           = useState([]);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [processing, setProcessing] = useState(null);
  const [loading, setLoading]     = useState(true);

  async function load() {
    setLoading(true);
    const res = await apiGet("/pro/admin/list");
    if (res.success) setSubs((res.data.subscriptions || []).map(s => ({
      ...s,
      id:          s._id?.toString() || s.id,
      userName:    s.userId?.name  || "–",
      userEmail:   s.userId?.email || "–",
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = subs
    .filter(s => filter === "all" || s.paymentStatus === filter)
    .filter(s =>
      !search ||
      (s.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.paymentNote || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.id || "").includes(search)
    );

  const waiting = subs.filter(s => s.paymentStatus === "waiting_admin_confirm");

  async function handleConfirm(id) {
    setProcessing(id);
    try {
      const res = await apiPatch(`/pro/${id}/admin-confirm`, {});
      if (!res.success) throw new Error(res.message);
      await load();
    } catch (e) { alert(e.message || "Xác nhận thất bại"); }
    finally { setProcessing(null); }
  }

  async function handleReject(id) {
    if (!window.confirm("Từ chối đơn nâng cấp Pro này?")) return;
    setProcessing(id);
    try {
      const res = await apiPatch(`/pro/${id}/admin-reject`, {});
      if (!res.success) throw new Error(res.message);
      await load();
    } catch (e) { alert(e.message || "Từ chối thất bại"); }
    finally { setProcessing(null); }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">GoTix Pro</h1>
        <p className="admin-page-subtitle">Xác nhận các đơn nâng cấp tài khoản Pro</p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng đơn</p>
          <p className="admin-stat-value">{subs.length}</p>
        </div>
        <div className="admin-stat-card" style={{ borderTop: waiting.length > 0 ? "3px solid #f59e0b" : undefined }}>
          <p className="admin-stat-label">Chờ xác nhận</p>
          <p className="admin-stat-value" style={{ color: waiting.length > 0 ? "#d97706" : undefined }}>
            {waiting.length}
          </p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Đã kích hoạt</p>
          <p className="admin-stat-value">{subs.filter(s => s.paymentStatus === "paid").length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng thu</p>
          <p className="admin-stat-value" style={{ fontSize: 18 }}>
            {formatPrice(subs.filter(s => s.paymentStatus === "paid").reduce((a, s) => a + (s.price || 0), 0))}
          </p>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Danh sách đơn Pro</span>
          <div className="admin-section-actions">
            <input
              className="admin-search"
              placeholder="Tìm tên, nội dung CK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="admin-search"
              style={{ minWidth: 160 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="waiting_admin_confirm">Chờ xác nhận</option>
              <option value="pending_payment">Chờ thanh toán</option>
              <option value="paid">Đã xác nhận</option>
              <option value="failed">Thất bại</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">Không có đơn nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Gói</th>
                  <th>Nội dung CK</th>
                  <th>Số tiền</th>
                  <th>Hết hạn TT</th>
                  <th>Thời gian tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <div className="admin-cell-main">{sub.userName}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub.userEmail}</div>
                    </td>
                    <td>
                      <span style={{
                        background: "#eff6ff", color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        padding: "2px 8px", borderRadius: 100,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {PLAN_LABELS[sub.plan] || sub.plan}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "monospace", background: "#f1f5f9",
                        padding: "2px 7px", borderRadius: 4,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {sub.paymentNote || "–"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(sub.price)}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{formatDate(sub.paymentExpiredAt)}</td>
                    <td style={{ fontSize: 12, color: "#6b7280" }}>{formatDate(sub.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${STATUS_CONFIG[sub.paymentStatus]?.cls || "admin-badge-warning"}`}>
                        {STATUS_CONFIG[sub.paymentStatus]?.label || sub.paymentStatus}
                      </span>
                    </td>
                    <td>
                      {sub.paymentStatus === "waiting_admin_confirm" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            onClick={() => handleConfirm(sub.id)}
                            disabled={processing === sub.id}
                          >
                            {processing === sub.id ? "..." : "Xác nhận"}
                          </button>
                          <button
                            style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            onClick={() => handleReject(sub.id)}
                            disabled={processing === sub.id}
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
