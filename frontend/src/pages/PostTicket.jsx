import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { LOCATIONS, CINEMA_CHAINS } from "../data/mockData";
import "./PostTicket.css";

export default function PostTicket() {
  const { addTicket } = useTickets();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [ticketFile, setTicketFile] = useState(null);
  const [qrFile, setQrFile]         = useState(null);
  const [ticketPreview, setTicketPreview] = useState("");
  const [qrPreview, setQrPreview]         = useState("");

  const [form, setForm] = useState({
    movieTitle: "", cinemaName: "", cinemaAddress: "", city: "",
    showDate: "", showTime: "", room: "", seats: "",
    quantity: 1, originalPrice: "", passPrice: "", description: "",
  });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.movieTitle.trim())   e.movieTitle   = "Vui lòng nhập tên phim";
    if (!form.cinemaName.trim())   e.cinemaName   = "Vui lòng nhập tên rạp";
    if (!form.city)                e.city         = "Vui lòng chọn khu vực";
    if (!form.showDate)            e.showDate     = "Vui lòng chọn ngày chiếu";
    if (!form.showTime)            e.showTime     = "Vui lòng chọn giờ chiếu";
    if (!form.originalPrice || Number(form.originalPrice) <= 0)
      e.originalPrice = "Vui lòng nhập giá gốc hợp lệ";
    if (!form.passPrice || Number(form.passPrice) <= 0)
      e.passPrice = "Vui lòng nhập giá pass hợp lệ";
    if (Number(form.passPrice) > Number(form.originalPrice))
      e.passPrice = "Giá pass không được cao hơn giá gốc";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",         form.movieTitle);
      fd.append("category",      "movie");
      fd.append("location",      form.cinemaName);
      fd.append("city",          form.city);
      fd.append("eventDate",     form.showDate);
      fd.append("eventTime",     form.showTime);
      fd.append("originalPrice", form.originalPrice);
      fd.append("resalePrice",   form.passPrice);
      fd.append("quantity",      form.quantity);
      if (form.description) fd.append("description", form.description);

      const details = {
        movieTitle:    form.movieTitle,
        cinemaName:    form.cinemaName,
        cinemaAddress: form.cinemaAddress,
        room:          form.room,
        seats: form.seats
          ? form.seats.split(",").map(s => s.trim()).filter(Boolean)
          : [],
      };
      fd.append("details", JSON.stringify(details));

      if (ticketFile) fd.append("ticketImage", ticketFile);
      if (qrFile)     fd.append("qrImage",     qrFile);

      await addTicket(fd);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="post-ticket-page">
        <div className="container">
          <div className="submit-success">
            <div className="success-icon">✓</div>
            <h2>Vé phim đã được gửi duyệt</h2>
            <p>GoTix sẽ kiểm tra và duyệt vé của bạn trong vòng 24 giờ. Bạn sẽ nhận thông báo khi vé được chấp thuận.</p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => navigate("/buyer")}>Xem vé của tôi</button>
              <button className="btn btn-ghost" onClick={() => {
                setForm({ movieTitle:"",cinemaName:"",cinemaAddress:"",city:"",showDate:"",showTime:"",room:"",seats:"",quantity:1,originalPrice:"",passPrice:"",description:"" });
                setTicketFile(null); setQrFile(null);
                setTicketPreview(""); setQrPreview("");
                setSubmitted(false);
              }}>
                Đăng vé khác
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-ticket-page">
      <div className="container">
        <div className="post-ticket-header">
          <h1>Đăng vé phim cần pass</h1>
          <p>Vé sẽ được admin kiểm tra và duyệt trước khi hiển thị công khai.</p>
        </div>

        <form onSubmit={handleSubmit} className="post-ticket-form">

          {/* Section 1: Thông tin phim */}
          <div className="form-section">
            <h2 className="form-section-title">Thông tin phim</h2>
            <div className="form-grid-2">

              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Tên phim <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.movieTitle ? "input-error" : ""}`}
                  placeholder="VD: Avengers: Secret Wars"
                  value={form.movieTitle}
                  onChange={e => set("movieTitle", e.target.value)}
                />
                {errors.movieTitle && <span className="form-error">{errors.movieTitle}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Tên rạp <span className="required">*</span></label>
                <input
                  type="text"
                  list="cinema-list"
                  className={`form-input ${errors.cinemaName ? "input-error" : ""}`}
                  placeholder="VD: CGV Vincom Đống Đa"
                  value={form.cinemaName}
                  onChange={e => set("cinemaName", e.target.value)}
                />
                <datalist id="cinema-list">
                  {CINEMA_CHAINS.map(c => <option key={c} value={c} />)}
                </datalist>
                {errors.cinemaName && <span className="form-error">{errors.cinemaName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Khu vực <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.city ? "input-error" : ""}`}
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                >
                  <option value="">Chọn khu vực</option>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Địa chỉ rạp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Vincom Đống Đa, 187 Giảng Võ, Hà Nội"
                  value={form.cinemaAddress}
                  onChange={e => set("cinemaAddress", e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Section 2: Suất chiếu & Ghế */}
          <div className="form-section">
            <h2 className="form-section-title">Suất chiếu & Ghế ngồi</h2>
            <div className="form-grid-2">

              <div className="form-group">
                <label className="form-label">Ngày chiếu <span className="required">*</span></label>
                <input
                  type="date"
                  className={`form-input ${errors.showDate ? "input-error" : ""}`}
                  value={form.showDate}
                  onChange={e => set("showDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.showDate && <span className="form-error">{errors.showDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Giờ chiếu <span className="required">*</span></label>
                <input
                  type="time"
                  className={`form-input ${errors.showTime ? "input-error" : ""}`}
                  value={form.showTime}
                  onChange={e => set("showTime", e.target.value)}
                />
                {errors.showTime && <span className="form-error">{errors.showTime}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Phòng chiếu</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Phòng 5, IMAX, 4DX..."
                  value={form.room}
                  onChange={e => set("room", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số ghế</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: D5, D6 (cách nhau bằng dấu phẩy)"
                  value={form.seats}
                  onChange={e => set("seats", e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Section 3: Giá & Số lượng */}
          <div className="form-section">
            <h2 className="form-section-title">Giá & Số lượng</h2>
            <div className="form-grid-3">

              <div className="form-group">
                <label className="form-label">Giá gốc (đ) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`form-input ${errors.originalPrice ? "input-error" : ""}`}
                  placeholder="VD: 120000"
                  value={form.originalPrice}
                  onChange={e => set("originalPrice", e.target.value)}
                  min="0"
                />
                {errors.originalPrice && <span className="form-error">{errors.originalPrice}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Giá pass (đ) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`form-input ${errors.passPrice ? "input-error" : ""}`}
                  placeholder="VD: 90000"
                  value={form.passPrice}
                  onChange={e => set("passPrice", e.target.value)}
                  min="0"
                />
                {errors.passPrice && <span className="form-error">{errors.passPrice}</span>}
                {form.originalPrice && form.passPrice && Number(form.passPrice) <= Number(form.originalPrice) && (
                  <span className="price-hint">
                    Giảm {Math.round(((Number(form.originalPrice) - Number(form.passPrice)) / Number(form.originalPrice)) * 100)}% so với giá gốc
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Số lượng vé <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={form.quantity}
                  onChange={e => set("quantity", e.target.value)}
                  min="1"
                  max="20"
                />
              </div>

            </div>
          </div>

          {/* Section 4: Upload ảnh */}
          <div className="form-section">
            <h2 className="form-section-title">Ảnh vé & Mã QR</h2>
            <p className="form-section-desc">
              Upload ảnh vé hoặc QR để tăng độ tin cậy. Admin sẽ dùng ảnh này để xác minh vé.
            </p>
            <div className="form-grid-2">

              <div className="form-group">
                <label className="form-label">Ảnh vé</label>
                <div className="upload-area">
                  {ticketPreview ? (
                    <div className="upload-preview-single">
                      <img src={ticketPreview} alt="Ảnh vé" />
                      <button type="button" className="preview-remove" onClick={() => { setTicketFile(null); setTicketPreview(""); }}>×</button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p>Chọn ảnh vé</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="upload-input" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setTicketFile(f); setTicketPreview(URL.createObjectURL(f)); }
                  }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mã QR vé</label>
                <div className="upload-area">
                  {qrPreview ? (
                    <div className="upload-preview-single">
                      <img src={qrPreview} alt="QR vé" />
                      <button type="button" className="preview-remove" onClick={() => { setQrFile(null); setQrPreview(""); }}>×</button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/>
                        <rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4" rx="0.5"/>
                        <line x1="18" y1="14" x2="22" y2="14"/><line x1="22" y1="14" x2="22" y2="18"/>
                        <line x1="18" y1="22" x2="22" y2="22"/>
                      </svg>
                      <p>Chọn mã QR</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="upload-input" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setQrFile(f); setQrPreview(URL.createObjectURL(f)); }
                  }} />
                </div>
              </div>

            </div>
          </div>

          {/* Section 5: Mô tả */}
          <div className="form-section">
            <h2 className="form-section-title">Mô tả thêm</h2>
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Lý do pass vé, tình trạng vé, lưu ý cho người mua..."
                value={form.description}
                onChange={e => set("description", e.target.value)}
                maxLength={500}
              />
              <span className="char-count">{form.description.length}/500</span>
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            {submitError && <div className="alert alert-error mb-md">{submitError}</div>}
            <p className="submit-note">
              Vé sẽ hiển thị sau khi admin duyệt. Thời gian duyệt thông thường trong vòng 24 giờ.
            </p>
            <div className="submit-btns">
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>Hủy</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi vé chờ duyệt"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
