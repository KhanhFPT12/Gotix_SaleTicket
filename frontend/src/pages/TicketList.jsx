import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { TICKET_CATEGORIES, LOCATIONS } from "../data/mockData";
import { useTickets } from "../context/TicketContext";
import TicketCard from "../components/tickets/TicketCard";
import "./TicketList.css";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "date_asc", label: "Ngày sự kiện gần nhất" },
];

export default function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tickets } = useTickets();

  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [verified, setVerified] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const currentCity = searchParams.get("city") || "";
  const currentQ = searchParams.get("q") || "";

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
    setPriceMin("");
    setPriceMax("");
    setVerified(false);
    setSort("newest");
  }

  const filtered = useMemo(() => {
    let list = tickets.filter((t) => t.status === "approved");

    if (currentQ) {
      const q = currentQ.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (currentCategory) list = list.filter((t) => t.category === currentCategory);
    if (currentCity) list = list.filter((t) => t.city === currentCity);
    if (priceMin) list = list.filter((t) => t.passPrice >= Number(priceMin));
    if (priceMax) list = list.filter((t) => t.passPrice <= Number(priceMax));
    if (verified) list = list.filter((t) => t.verified);

    switch (sort) {
      case "price_asc":
        return [...list].sort((a, b) => a.passPrice - b.passPrice);
      case "price_desc":
        return [...list].sort((a, b) => b.passPrice - a.passPrice);
      case "date_asc":
        return [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
      default:
        return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [tickets, currentQ, currentCategory, currentCity, priceMin, priceMax, verified, sort]);

  const hasActiveFilters = currentCategory || currentCity || currentQ || priceMin || priceMax || verified;

  return (
    <div className="ticket-list-page">
      <div className="container">
        {/* Page header */}
        <div className="ticket-list-header">
          <div>
            <h1 className="page-title">
              {currentCategory
                ? TICKET_CATEGORIES.find((c) => c.id === currentCategory)?.label || "Tất cả vé"
                : currentQ
                ? `Kết quả cho "${currentQ}"`
                : "Tất cả vé"}
            </h1>
            <p className="result-count">{filtered.length} vé được tìm thấy</p>
          </div>
          <div className="sort-wrap">
            <label className="sort-label">Sắp xếp:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="form-select sort-select"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ticket-list-layout">
          {/* Filters sidebar */}
          <aside className="filter-sidebar">
            <div className="filter-header">
              <span className="filter-title">Bộ lọc</span>
              {hasActiveFilters && (
                <button className="filter-clear" onClick={clearFilters}>Xóa lọc</button>
              )}
            </div>

            {/* Search */}
            <div className="filter-section">
              <label className="filter-label">Từ khóa</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tên vé, địa điểm..."
                value={currentQ}
                onChange={(e) => setFilter("q", e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="filter-section">
              <label className="filter-label">Danh mục</label>
              <div className="filter-options">
                <label className="filter-radio">
                  <input
                    type="radio"
                    name="category"
                    checked={!currentCategory}
                    onChange={() => setFilter("category", "")}
                  />
                  <span>Tất cả</span>
                </label>
                {TICKET_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="filter-radio">
                    <input
                      type="radio"
                      name="category"
                      checked={currentCategory === cat.id}
                      onChange={() => setFilter("category", cat.id)}
                    />
                    <span>{cat.icon} {cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* City */}
            <div className="filter-section">
              <label className="filter-label">Khu vực</label>
              <select
                className="form-select"
                value={currentCity}
                onChange={(e) => setFilter("city", e.target.value)}
              >
                <option value="">Tất cả khu vực</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="filter-section">
              <label className="filter-label">Giá (đ)</label>
              <div className="price-range">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Từ"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
                <span className="price-dash">–</span>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Đến"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
            </div>

            {/* Verified */}
            <div className="filter-section">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                />
                <span>Chỉ vé đã xác minh</span>
              </label>
            </div>
          </aside>

          {/* Results */}
          <div className="ticket-results">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>Không tìm thấy vé</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button className="btn btn-outline mt-md" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="results-grid">
                {filtered.map((ticket) => (
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
