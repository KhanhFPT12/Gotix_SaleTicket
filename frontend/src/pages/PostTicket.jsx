import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { TICKET_CATEGORIES, LOCATIONS } from "../data/mockData";
import "./PostTicket.css";

export default function PostTicket() {
  const { addTicket } = useTickets();
  const navigate = useNavigate();
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageFiles, setImageFiles]   = useState([]);
  const [form, setForm] = useState({
    title: "", category: "", location: "", city: "",
    date: "", time: "", originalPrice: "", passPrice: "",
    quantity: 1, seatInfo: "", description: "", images: [],
  });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.title) e.title = "Vui lòng nhập tên vé";
    if (!form.category) e.category = "Vui lòng chọn loại vé";
    if (!form.location) e.location = "Vui lòng nhập địa điểm";
    if (!form.city) e.city = "Vui lòng chọn khu vực";
    if (!form.date) e.date = "Vui lòng chọn ngày";
    if (!form.time) e.time = "Vui lòng chọn giờ";
    if (!form.originalPrice || Number(form.originalPrice) <= 0) e.originalPrice = "Vui lòng nhập giá gốc hợp lệ";
    if (!form.passPrice || Number(form.passPrice) <= 0) e.passPrice = "Vui lòng nhập giá pass hợp lệ";
    if (Number(form.passPrice) > Number(form.originalPrice)) e.passPrice = "Giá pass không được cao hơn giá gốc";
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
      fd.append("title",         form.title);
      fd.append("category",      form.category);
      fd.append("location",      form.location);
      fd.append("city",          form.city);
      fd.append("eventDate",     `${form.date}T${form.time}:00`);
      fd.append("originalPrice", form.originalPrice);
      fd.append("resalePrice",   form.passPrice);
      fd.append("quantity",      form.quantity);
      if (form.seatInfo)    fd.append("seatSection",  form.seatInfo);
      if (form.description) fd.append("description",  form.description);
      imageFiles.forEach((f) => fd.append("ticketImage", f));
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
            <h2>Vé đã được gửi duyệt</h2>
            <p>GoTix sẽ xem xét và duyệt vé của bạn trong vòng 24 giờ. Bạn sẽ nhận thông báo khi vé được chấp thuận.</p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => navigate("/buyer")}>Xem vé của tôi</button>
              <button className="btn btn-ghost" onClick={() => {
                setForm({ title:"",category:"",location:"",city:"",date:"",time:"",originalPrice:"",passPrice:"",quantity:1,seatInfo:"",description:"",images:[] });
                setImageFiles([]);
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
          <h1>Đăng vé cần pass</h1>
          <p>Vé sẽ được admin xét duyệt trước khi hiển thị công khai.</p>
        </div>

        <form onSubmit={handleSubmit} className="post-ticket-form">
          {/* Section 1: Basic info */}
          <div className="form-section">
            <h2 className="form-section-title">Thông tin vé</h2>
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Tên vé / Sự kiện <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.title ? "input-error" : ""}`}
                  placeholder="VD: Concert BLACKPINK World Tour – Hà Nội"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Loại vé <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.category ? "input-error" : ""}`}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Chọn loại vé</option>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Khu vực <span className="required">*</span></label>
                <select
                  className={`form-select ${errors.city ? "input-error" : ""}`}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                >
                  <option value="">Chọn khu vực</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {errors.city && <span className="form-error">{errors.city}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Địa điểm cụ thể <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.location ? "input-error" : ""}`}
                  placeholder="VD: Sân vận động Mỹ Đình, Hà Nội"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                />
                {errors.location && <span className="form-error">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Ngày sự kiện <span className="required">*</span></label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? "input-error" : ""}`}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Giờ bắt đầu <span className="required">*</span></label>
                <input
                  type="time"
                  className={`form-input ${errors.time ? "input-error" : ""}`}
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
                {errors.time && <span className="form-error">{errors.time}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Thông tin ghế / Khu vực ngồi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Khu A2 – Hàng 12 – Ghế 23, 24"
                  value={form.seatInfo}
                  onChange={(e) => set("seatInfo", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="form-section">
            <h2 className="form-section-title">Giá & Số lượng</h2>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Giá gốc (đ) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`form-input ${errors.originalPrice ? "input-error" : ""}`}
                  placeholder="VD: 1500000"
                  value={form.originalPrice}
                  onChange={(e) => set("originalPrice", e.target.value)}
                  min="0"
                />
                {errors.originalPrice && <span className="form-error">{errors.originalPrice}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Giá pass (đ) <span className="required">*</span></label>
                <input
                  type="number"
                  className={`form-input ${errors.passPrice ? "input-error" : ""}`}
                  placeholder="VD: 1200000"
                  value={form.passPrice}
                  onChange={(e) => set("passPrice", e.target.value)}
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
                <label className="form-label">Số lượng vé</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Upload */}
          <div className="form-section">
            <h2 className="form-section-title">Ảnh vé / Mã QR</h2>
            <p className="form-section-desc">
              Upload ảnh vé hoặc mã QR để tăng độ tin cậy. GoTix sẽ xác minh ảnh trong quá trình duyệt.
            </p>
            <div className="upload-area">
              <div className="upload-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Kéo thả hoặc nhấp để chọn ảnh</p>
                <span>JPG, PNG, PDF – Tối đa 5MB mỗi file</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="upload-input"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setImageFiles(files);
                  set("images", files.map((f) => URL.createObjectURL(f)));
                }}
              />
            </div>
            {form.images.length > 0 && (
              <div className="upload-preview">
                {form.images.map((src, i) => (
                  <div key={i} className="preview-item">
                    <img src={src} alt="" />
                    <button
                      type="button"
                      className="preview-remove"
                      onClick={() => {
                        setImageFiles((prev) => prev.filter((_, j) => j !== i));
                        set("images", form.images.filter((_, j) => j !== i));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Description */}
          <div className="form-section">
            <h2 className="form-section-title">Mô tả thêm</h2>
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Lý do pass vé, tình trạng vé, các lưu ý cho người mua..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <span className="char-count">{form.description.length}/500</span>
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            {submitError && <div className="alert alert-error mb-md">{submitError}</div>}
            <p className="submit-note">
              Vé sẽ được hiển thị sau khi admin duyệt. Thời gian duyệt thông thường trong vòng 24 giờ.
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
