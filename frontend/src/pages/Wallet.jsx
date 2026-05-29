import { useState, useEffect } from "react";
import { useTickets } from "../context/TicketContext";
import { apiGetAdminBankInfo } from "../api/client";
import "./Wallet.css";

function formatPrice(p) {
  if (!p && p !== 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CFG = {
  pending:  { label: "Chờ xử lý", cls: "wstatus-pending"  },
  approved: { label: "Đã duyệt",  cls: "wstatus-approved" },
  rejected: { label: "Từ chối",   cls: "wstatus-rejected" },
};

const TX_STATUS_MAP = {
  completed: { label: "Hoàn tất",    cls: "wstatus-approved" },
  pending:   { label: "Chờ xử lý",  cls: "wstatus-pending"  },
  cancelled: { label: "Đã hủy",      cls: "wstatus-rejected" },
};

const BANKS = [
  "Vietcombank","Techcombank","VPBank","MB Bank",
  "Agribank","BIDV","ACB","TPBank","OCB","HDBank",
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const INIT_WD = { amount: "", bankName: "", bankAccount: "", bankAccountName: "" };

export default function Wallet() {
  const {
    wallet, walletHistory, myWithdrawals, myTopUps,
    createWithdrawal, createTopUp, refreshWallet,
  } = useTickets();

  const [tab, setTab]               = useState("overview");
  const [bankInfo, setBankInfo]     = useState(null);

  // Top-up state
  const [topUpAmount, setTopUpAmount]   = useState("");
  const [topUpStep, setTopUpStep]       = useState("form"); // form | qr | done
  const [currentTopUp, setCurrentTopUp] = useState(null);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError]     = useState("");

  // Withdrawal state
  const [wdForm, setWdForm]         = useState(INIT_WD);
  const [wdSubmitting, setWdSubmit] = useState(false);
  const [wdError, setWdError]       = useState("");
  const [wdDone, setWdDone]         = useState(false);

  useEffect(() => {
    apiGetAdminBankInfo().then(res => {
      if (res.success) setBankInfo(res.data.bank);
    });
  }, []);

  // Build VietQR URL
  function buildQrUrl(bank, amount, code) {
    if (!bank) return "";
    const info = encodeURIComponent(code);
    const name = encodeURIComponent(bank.accountName);
    return `https://img.vietqr.io/image/${bank.bankBin}-${bank.accountNumber}-print.png?amount=${amount}&addInfo=${info}&accountName=${name}`;
  }

  async function handleCreateTopUp(e) {
    e.preventDefault();
    setTopUpError("");
    const amt = Number(topUpAmount);
    if (!amt || amt < 10000) return setTopUpError("Số tiền nạp tối thiểu 10.000đ");
    try {
      setTopUpLoading(true);
      const result = await createTopUp(amt);
      setCurrentTopUp(result);
      setTopUpStep("qr");
    } catch (e) {
      setTopUpError(e.message);
    } finally {
      setTopUpLoading(false);
    }
  }

  function handleTopUpDone() {
    setTopUpStep("done");
    setTopUpAmount("");
  }

  function handleNewTopUp() {
    setTopUpStep("form");
    setCurrentTopUp(null);
    setTopUpError("");
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setWdError("");
    const amt = Number(wdForm.amount);
    if (!amt || amt < 1000) return setWdError("Số tiền tối thiểu 1.000đ");
    if (amt > (wallet?.availableBalance ?? 0)) return setWdError("Số dư khả dụng không đủ");
    if (!wdForm.bankName || !wdForm.bankAccount || !wdForm.bankAccountName) {
      return setWdError("Vui lòng nhập đầy đủ thông tin ngân hàng");
    }
    try {
      setWdSubmit(true);
      await createWithdrawal(wdForm);
      setWdForm(INIT_WD);
      setWdDone(true);
      setTimeout(() => setWdDone(false), 4000);
    } catch (e) {
      setWdError(e.message);
    } finally {
      setWdSubmit(false);
    }
  }

  const TABS = [
    { id: "overview", label: "Lịch sử ví" },
    { id: "topup",    label: "Nạp tiền" },
    { id: "topup-history", label: "Lịch sử nạp" },
    { id: "withdraw", label: "Rút tiền" },
    { id: "withdraw-history", label: "Lịch sử rút" },
  ];

  return (
    <div className="wallet-page">
      <div className="container">
        <h1 className="page-heading">Ví của tôi</h1>

        {/* Balance cards */}
        <div className="wallet-balance-row">
          <div className="wallet-balance-card available">
            <p className="wbal-label">Số dư khả dụng</p>
            <p className="wbal-value">{formatPrice(wallet?.availableBalance ?? 0)}</p>
            <p className="wbal-hint">Có thể rút hoặc dùng mua vé</p>
          </div>
          <div className="wallet-balance-card pending">
            <p className="wbal-label">Đang chờ xử lý</p>
            <p className="wbal-value">{formatPrice(wallet?.pendingBalance ?? 0)}</p>
            <p className="wbal-hint">Chờ người mua xác nhận nhận vé</p>
          </div>
          <div className="wallet-balance-card total">
            <p className="wbal-label">Tổng doanh thu</p>
            <p className="wbal-value">{formatPrice(wallet?.totalRevenue ?? 0)}</p>
            <p className="wbal-hint">Kể từ khi đăng ký</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="wallet-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`wallet-tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Lịch sử ví ── */}
        {tab === "overview" && (
          <div className="wallet-section card">
            {walletHistory.length === 0 ? (
              <div className="empty-box">Chưa có biến động ví nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Nội dung</th>
                    <th>Số tiền</th>
                    <th>Phí (5%)</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {walletHistory.map((item, i) => (
                    <tr key={item.id ?? i}>
                      <td>
                        <span className={`badge ${item.type === "sale" ? "badge-success" : "badge-info"}`}>
                          {item.type === "sale" ? "Bán vé" : "Rút tiền"}
                        </span>
                      </td>
                      <td className="wh-title">
                        {item.type === "sale"
                          ? <>{item.title}<br /><span className="text-sm text-secondary">Người mua: {item.buyerName}</span></>
                          : <>{item.bank}</>
                        }
                      </td>
                      <td>
                        {item.type === "sale"
                          ? <span className="amount-positive">+{formatPrice(item.amount)}</span>
                          : <span className="amount-negative">-{formatPrice(item.amount)}</span>
                        }
                      </td>
                      <td className="text-sm text-secondary">
                        {item.type === "sale" ? formatPrice(item.platformFee) : "—"}
                      </td>
                      <td>
                        <span className={`wstatus-badge ${TX_STATUS_MAP[item.status]?.cls ?? STATUS_CFG[item.status]?.cls}`}>
                          {TX_STATUS_MAP[item.status]?.label ?? STATUS_CFG[item.status]?.label}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{formatDate(item.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB: Nạp tiền ── */}
        {tab === "topup" && (
          <div className="wallet-section">
            <div className="topup-layout">

              {/* Left: form / QR / done */}
              <div className="topup-main card">
                {topUpStep === "form" && (
                  <>
                    <h3 className="topup-title">Nạp tiền vào ví</h3>
                    <p className="topup-subtitle">
                      Nhập số tiền và bấm tạo lệnh — hệ thống sẽ hiển thị mã QR chuyển khoản VietinBank cho bạn.
                    </p>

                    <form onSubmit={handleCreateTopUp}>
                      <div className="form-group">
                        <label className="form-label">Số tiền nạp</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Tối thiểu 10.000đ"
                          min="10000"
                          value={topUpAmount}
                          onChange={e => setTopUpAmount(e.target.value)}
                        />
                      </div>

                      <div className="topup-quick-amounts">
                        {QUICK_AMOUNTS.map(a => (
                          <button
                            key={a}
                            type="button"
                            className={`topup-quick-btn ${Number(topUpAmount) === a ? "active" : ""}`}
                            onClick={() => setTopUpAmount(a)}
                          >
                            {formatPrice(a)}
                          </button>
                        ))}
                      </div>

                      {topUpError && <p className="form-error">{topUpError}</p>}

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={topUpLoading}
                        style={{ width: "100%", marginTop: "1rem" }}
                      >
                        {topUpLoading ? "Đang tạo lệnh..." : "Tạo lệnh nạp tiền"}
                      </button>
                    </form>
                  </>
                )}

                {topUpStep === "qr" && currentTopUp && (
                  <>
                    <div className="topup-qr-header">
                      <h3 className="topup-title">Quét mã để chuyển khoản</h3>
                      <p className="topup-subtitle">
                        Mở app ngân hàng, quét mã QR hoặc chuyển khoản thủ công theo thông tin bên dưới.
                      </p>
                    </div>

                    <div className="topup-qr-wrap">
                      {bankInfo && (
                        <img
                          src={buildQrUrl(bankInfo, currentTopUp.topUp.amount, currentTopUp.transferCode)}
                          alt="QR chuyển khoản"
                          className="topup-qr-img"
                        />
                      )}
                    </div>

                    <div className="topup-transfer-info">
                      <div className="transfer-row">
                        <span>Ngân hàng</span>
                        <strong>{bankInfo?.bankName}</strong>
                      </div>
                      <div className="transfer-row">
                        <span>Số tài khoản</span>
                        <strong className="transfer-copy">{bankInfo?.accountNumber}</strong>
                      </div>
                      <div className="transfer-row">
                        <span>Chủ tài khoản</span>
                        <strong>{bankInfo?.accountName}</strong>
                      </div>
                      <div className="transfer-row highlight">
                        <span>Số tiền</span>
                        <strong>{formatPrice(currentTopUp.topUp.amount)}</strong>
                      </div>
                      <div className="transfer-row highlight">
                        <span>Nội dung chuyển khoản</span>
                        <strong className="transfer-code">{currentTopUp.transferCode}</strong>
                      </div>
                    </div>

                    <div className="topup-warning">
                      Nhập đúng nội dung chuyển khoản để admin xác nhận được lệnh nạp của bạn.
                    </div>

                    <div className="topup-actions">
                      <button className="btn btn-primary" onClick={handleTopUpDone}>
                        Tôi đã chuyển khoản
                      </button>
                      <button className="btn btn-ghost" onClick={handleNewTopUp}>
                        Tạo lệnh mới
                      </button>
                    </div>
                  </>
                )}

                {topUpStep === "done" && (
                  <div className="topup-done">
                    <div className="topup-done-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <h3>Lệnh nạp đã được ghi nhận</h3>
                    <p>
                      GoTix sẽ xác minh giao dịch và cộng tiền vào ví của bạn trong vòng <strong>15 phút – 2 giờ</strong>.
                      Bạn có thể kiểm tra trạng thái tại tab <em>Lịch sử nạp</em>.
                    </p>
                    <div className="topup-actions">
                      <button className="btn btn-outline" onClick={handleNewTopUp}>
                        Nạp tiếp
                      </button>
                      <button className="btn btn-ghost" onClick={() => setTab("topup-history")}>
                        Xem lịch sử nạp
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="topup-guide card">
                <h4>Cách nạp tiền</h4>
                <ol className="topup-steps">
                  <li>Nhập số tiền muốn nạp và bấm <strong>Tạo lệnh nạp tiền</strong></li>
                  <li>Quét mã QR hoặc chuyển khoản theo thông tin hiển thị</li>
                  <li>Ghi đúng <strong>nội dung chuyển khoản</strong> để hệ thống nhận diện</li>
                  <li>Tiền sẽ được cộng vào ví sau khi GoTix xác nhận giao dịch</li>
                </ol>
                <div className="topup-guide-note">
                  <p>Số tiền nạp tối thiểu: <strong>10.000đ</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Lịch sử nạp tiền ── */}
        {tab === "topup-history" && (
          <div className="wallet-section card">
            {myTopUps.length === 0 ? (
              <div className="empty-box">Chưa có lệnh nạp tiền nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã lệnh</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {myTopUps.map(tu => (
                    <tr key={tu.id}>
                      <td>
                        <code className="transfer-code-sm">{tu.transferCode}</code>
                      </td>
                      <td className="font-semibold amount-positive">+{formatPrice(tu.amount)}</td>
                      <td>
                        <span className={`wstatus-badge ${STATUS_CFG[tu.status]?.cls}`}>
                          {STATUS_CFG[tu.status]?.label}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{tu.adminNote || "—"}</td>
                      <td className="text-sm text-secondary">{formatDate(tu.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB: Rút tiền ── */}
        {tab === "withdraw" && (
          <div className="wallet-section">
            <div className="withdraw-layout">
              <div className="withdraw-form-wrap card">
                <h3 className="withdraw-form-title">Tạo yêu cầu rút tiền</h3>
                <p className="withdraw-balance-info">
                  Số dư khả dụng: <strong>{formatPrice(wallet?.availableBalance ?? 0)}</strong>
                </p>

                {wdDone && (
                  <div className="form-success-msg">Yêu cầu rút tiền đã được gửi thành công!</div>
                )}

                <form className="withdraw-form" onSubmit={handleWithdraw}>
                  <div className="form-group">
                    <label className="form-label">Số tiền rút (đ)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Tối thiểu 1.000đ"
                      min="1000"
                      max={wallet?.availableBalance ?? 0}
                      value={wdForm.amount}
                      onChange={e => setWdForm(f => ({ ...f, amount: e.target.value }))}
                    />
                    {(wallet?.availableBalance ?? 0) > 0 && (
                      <button
                        type="button"
                        className="withdraw-max-btn"
                        onClick={() => setWdForm(f => ({ ...f, amount: wallet.availableBalance }))}
                      >
                        Rút tất cả
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngân hàng</label>
                    <select
                      className="form-input"
                      value={wdForm.bankName}
                      onChange={e => setWdForm(f => ({ ...f, bankName: e.target.value }))}
                    >
                      <option value="">Chọn ngân hàng</option>
                      {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số tài khoản</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập số tài khoản"
                      value={wdForm.bankAccount}
                      onChange={e => setWdForm(f => ({ ...f, bankAccount: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập tên chủ tài khoản"
                      value={wdForm.bankAccountName}
                      onChange={e => setWdForm(f => ({ ...f, bankAccountName: e.target.value }))}
                    />
                  </div>

                  {wdError && <p className="form-error">{wdError}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={wdSubmitting}
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  >
                    {wdSubmitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
                  </button>
                </form>
              </div>

              <div className="withdraw-note card">
                <h4>Lưu ý</h4>
                <ul>
                  <li>Tối thiểu: <strong>1.000đ</strong></li>
                  <li>Chuyển khoản trong <strong>1–3 ngày</strong> làm việc sau khi admin duyệt</li>
                  <li>Phí nền tảng GoTix: <strong>5%</strong> / giao dịch bán</li>
                  <li>Tiền <em>chờ xử lý</em> chưa thể rút</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Lịch sử rút tiền ── */}
        {tab === "withdraw-history" && (
          <div className="wallet-section card">
            {myWithdrawals.length === 0 ? (
              <div className="empty-box">Chưa có yêu cầu rút tiền nào.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Số tiền</th>
                    <th>Ngân hàng</th>
                    <th>Số TK / Chủ TK</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú admin</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {myWithdrawals.map(wd => (
                    <tr key={wd.id}>
                      <td className="font-semibold amount-negative">-{formatPrice(wd.amount)}</td>
                      <td>{wd.bankName}</td>
                      <td>
                        <div>{wd.bankAccount}</div>
                        <div className="text-sm text-secondary">{wd.bankAccountName}</div>
                      </td>
                      <td>
                        <span className={`wstatus-badge ${STATUS_CFG[wd.status]?.cls}`}>
                          {STATUS_CFG[wd.status]?.label}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{wd.adminNote || "—"}</td>
                      <td className="text-sm text-secondary">{formatDate(wd.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
