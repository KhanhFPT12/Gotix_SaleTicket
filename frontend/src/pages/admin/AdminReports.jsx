import { useState, useEffect } from "react";
import { apiGet, apiPatch } from "../../api/client";
import "../../layouts/AdminLayout.css";

const STATUS_CFG = {
  pending:             { label: "Chờ xử lý",       cls: "admin-badge-warning" },
  requesting_evidence: { label: "Chờ bằng chứng", cls: "admin-badge-warning" },
  resolved:            { label: "Đã xử lý",         cls: "admin-badge-success" },
  rejected:            { label: "Từ chối",           cls: "admin-badge-neutral" },
};

const REASON_LABELS = {
  fake_ticket:         "Vé giả",
  invalid_qr:          "QR không hợp lệ",
  seller_unresponsive: "Người bán không phản hồi",
  wrong_info:          "Sai thông tin vé",
  transaction_issue:   "Giao dịch có vấn đề",
  other:               "Khác",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminReports() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap]     = useState({});

  async function load() {
    setLoading(true);
    const res = await apiGet(`/admin/reports?status=${filter}&limit=100`);
    if (res.success) setReports(res.data.reports || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handle(id, action, extra = {}) {
    setProcessing(id + action);
    const note = noteMap[id] || "";
    let res;
    if (action === "resolve")
      res = await apiPatch(`/reports/${id}/resolve`, { adminNote: note, resolution: note, ...extra });
    else if (action === "reject")
      res = await apiPatch(`/reports/${id}/reject`, { adminNote: note });
    else if (action === "evidence")
      res = await apiPatch(`/reports/${id}/request-evidence`, { adminNote: note });

    if (res?.success) {
      setReports(prev => prev.map(r => r._id === id ? res.data.report : r));
    } else {
      alert(res?.message || "Thao tác thất bại");
    }
    setProcessing(null);
  }

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Báo cáo & Tranh chấp</h1>
        <p className="admin-page-subtitle">Xử lý báo cáo vi phạm, tranh chấp giao dịch từ người dùng</p>
      </div>

      {/* Filter */}
      <div className="admin-section" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => (
            <button
              key={s}
              className={`admin-btn ${filter === s ? "admin-btn-primary" : "admin-btn-neutral"}`}
              onClick={() => setFilter(s)}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-section">
        {loading ? (
          <div className="admin-empty">Đang tải...</div>
        ) : reports.length === 0 ? (
          <div className="admin-empty">Không có báo cáo nào.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người báo cáo</th>
                <th>Vé bị báo cáo</th>
                <th>Lý do</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                {filter === "pending" && <th>Ghi chú / Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {reports.map(rp => (
                <tr key={rp._id}>
                  <td>
                    <div className="admin-cell-main">{rp.reporterId?.name || "–"}</div>
                    <div className="admin-cell-sub">{rp.reporterId?.email}</div>
                  </td>
                  <td>
                    <div className="admin-cell-main">{rp.ticketId?.title || rp.ticketId}</div>
                    <div className="admin-cell-sub">{rp.ticketId?.category}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-error">
                      {REASON_LABELS[rp.reason] || rp.reason}
                    </span>
                    {rp.description && <div className="admin-cell-sub" style={{ marginTop: 2 }}>{rp.description}</div>}
                  </td>
                  <td className="admin-cell-sub">{formatDate(rp.createdAt)}</td>
                  <td>
                    <span className={`admin-badge ${STATUS_CFG[rp.status]?.cls}`}>
                      {STATUS_CFG[rp.status]?.label}
                    </span>
                    {rp.adminNote && <div className="admin-cell-sub" style={{ marginTop: 2 }}>{rp.adminNote}</div>}
                    {rp.refundIssued && <div className="admin-cell-sub" style={{ color: "#16a34a" }}>Đã hoàn tiền</div>}
                  </td>
                  {filter === "pending" && (
                    <td>
                      {rp.status === "pending" || rp.status === "requesting_evidence" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <input
                            type="text"
                            className="admin-input-sm"
                            placeholder="Ghi chú admin"
                            value={noteMap[rp._id] || ""}
                            onChange={e => setNoteMap(m => ({ ...m, [rp._id]: e.target.value }))}
                          />
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              disabled={!!processing}
                              onClick={() => handle(rp._id, "resolve", { lockTicket: true })}
                            >
                              Xử lý (Khóa vé)
                            </button>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              disabled={!!processing}
                              onClick={() => handle(rp._id, "resolve", { refund: !!rp.transactionId, lockTicket: true })}
                            >
                              Hoàn tiền & Khóa
                            </button>
                            <button
                              className="admin-btn admin-btn-neutral admin-btn-sm"
                              disabled={!!processing}
                              onClick={() => handle(rp._id, "evidence")}
                            >
                              Yêu cầu bằng chứng
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              disabled={!!processing}
                              onClick={() => handle(rp._id, "reject")}
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="admin-cell-sub">Đã xử lý · {formatDate(rp.resolvedAt)}</span>
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
