import { useState, useEffect } from "react";
import { apiGet } from "../../api/client";
import "../../layouts/AdminLayout.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_LABELS = {
  approve_ticket:    { label: "Duyệt vé",        cls: "admin-badge-success" },
  reject_ticket:     { label: "Từ chối vé",      cls: "admin-badge-error" },
  lock_user:         { label: "Khóa user",        cls: "admin-badge-error" },
  unlock_user:       { label: "Mở khóa user",    cls: "admin-badge-success" },
  approve_withdrawal:{ label: "Duyệt rút tiền",  cls: "admin-badge-success" },
  reject_withdrawal: { label: "Từ chối rút tiền",cls: "admin-badge-error" },
  approve_topup:     { label: "Duyệt nạp tiền",  cls: "admin-badge-success" },
  reject_topup:      { label: "Từ chối nạp tiền",cls: "admin-badge-error" },
  resolve_report:    { label: "Xử lý báo cáo",   cls: "admin-badge-warning" },
};

export default function AdminAuditLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const LIMIT = 50;

  async function load(p = 1) {
    setLoading(true);
    const res = await apiGet(`/admin/audit-logs?page=${p}&limit=${LIMIT}`);
    if (res.success) {
      setLogs(res.data.logs || []);
      setTotal(res.data.pagination?.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Lịch sử thao tác Admin</h1>
        <p className="admin-page-subtitle">Theo dõi mọi hành động của admin trên hệ thống</p>
      </div>

      <div className="admin-section">
        {loading ? (
          <div className="admin-empty">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="admin-empty">Chưa có thao tác nào.</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Admin</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const cfg = ACTION_LABELS[log.action] || { label: log.action, cls: "admin-badge-warning" };
                  return (
                    <tr key={log._id || log.id}>
                      <td className="admin-cell-sub">{formatDate(log.createdAt)}</td>
                      <td>
                        <div className="admin-cell-main">{log.adminId?.name ?? "Admin"}</div>
                        <div className="admin-cell-sub">{log.adminId?.email ?? ""}</div>
                      </td>
                      <td>
                        <span className={`admin-badge ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="admin-cell-sub">{log.targetType}</td>
                      <td style={{ maxWidth: 280, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="admin-btn admin-btn-neutral" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                <span style={{ padding: "6px 12px", fontSize: 13 }}>{page} / {totalPages}</span>
                <button className="admin-btn admin-btn-neutral" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
