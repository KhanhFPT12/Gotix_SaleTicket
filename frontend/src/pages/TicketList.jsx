import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import TicketCard from "../components/tickets/TicketCard";
import "./TicketList.css";

const SORT_OPTIONS = [
  { value: "newest",       label: "Mới nhất" },
  { value: "priceAsc",     label: "Giá tăng dần" },
  { value: "priceDesc",    label: "Giá giảm dần" },
  { value: "eventDateAsc", label: "Suất chiếu gần nhất" },
  { value: "proFirst",     label: "Pro trước" },
];

export default function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tickets } = useTickets();

  const [sort,     setSort]     = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [verified, setVerified] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const currentQ      = searchParams.get("q")      || "";
  const currentCity   = searchParams.get("city")   || "";
  const currentCinema = searchParams.get("cinema") || "";

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
    setPriceMin(""); setPriceMax("");
    setVerified(false); setSort("newest");
    setDateFrom(""); setDateTo("");
  }

  const filtered = useMemo(() => {
    let list = tickets.filter(t => t.status === "approved");

    if (currentQ) {
      const q = currentQ.toLowerCase();
      list = list.filter(t =>
        (t.movieTitle || t.title || "").toLowerCase().includes(q) ||
        (t.cinema     || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    if (currentCity)   list = list.filter(t => (t.city   || "").toLowerCase().includes(currentCity.toLowerCase()));
    if (currentCinema) list = list.filter(t => (t.cinema || "").toLowerCase().includes(currentCinema.toLowerCase()));
    if (priceMin)      list = list.filter(t => t.passPrice >= Number(priceMin));
    if (priceMax)      list = list.filter(t => t.passPrice <= Number(priceMax));
    if (verified)      list = list.filter(t => t.verified);
    if (dateFrom)      list = list.filter(t => t.date >= dateFrom);
    if (dateTo)        list = list.filter(t => t.date <= dateTo);

    switch (sort) {
      case "priceAsc":     return [...list].sort((a, b) => a.passPrice - b.passPrice);
      case "priceDesc":    return [...list].sort((a, b) => b.passPrice - a.passPrice);
      case "eventDateAsc": return [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
      case "proFirst":     return [...list].sort((a, b) => (b.sellerIsPro ? 1 : 0) - (a.sellerIsPro ? 1 : 0));
      default:             return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [tickets, currentQ, currentCity, currentCinema, priceMin, priceMax, verified, sort, dateFrom, dateTo]);

  const hasActiveFilters = currentQ || currentCity || currentCinema || priceMin || priceMax || verified || dateFrom || dateTo;

  let pageTitle = "Vé phim đang pass";
  if (currentQ)      pageTitle = `Kết quả cho "${currentQ}"`;
  if (currentCinema) pageTitle = `Vé tại rạp ${currentCinema}`;

  return (
    <div className="ticket-list-page">
      <div className="container">

        <div className="ticket-list-header">
          <div>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="result-count">{filtered.length} vé phim được tìm thấy</p>
          </div>
          <div className="sort-wrap">
            <label className="sort-label">Sắp xếp:</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-select sort-select"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ticket-list-layout">
          {/* Filter sidebar */}
          <aside className="filter-sidebar">
            <div className="filter-header">
              <span className="filter-title">Bộ lọc</span>
              {hasActiveFilters && (
                <button className="filter-clear" onClick={clearFilters}>Xóa lọc</button>
              )}
            </div>

            <div className="filter-section">
              <label className="filter-label">Tên phim</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Avengers, Inside Out..."
                value={currentQ}
                onChange={e => setFilter("q", e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Tên rạp</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: CGV, BHD, Lotte..."
                value={currentCinema}
                onChange={e => setFilter("cinema", e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Khu vực</label>
              <select
                className="form-select"
                value={currentCity}
                onChange={e => setFilter("city", e.target.value)}
              >
                <option value="">Tất cả khu vực</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Ngày chiếu</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input type="date" className="form-input" placeholder="Từ ngày" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <input type="date" className="form-input" placeholder="Đến ngày" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-label">Giá pass (đ)</label>
              <div className="price-range">
                <input type="number" className="form-input" placeholder="Từ" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                <span className="price-dash">–</span>
                <input type="number" className="form-input" placeholder="Đến" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
              </div>
            </div>

            <div className="filter-section">
              <label className="filter-checkbox">
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />
                <span>Chỉ vé đã xác minh</span>
              </label>
            </div>
          </aside>

          {/* Results */}
          <div className="ticket-results">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <h3>Không tìm thấy vé phim</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button className="btn btn-outline mt-md" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="results-grid">
                {filtered.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
