import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ items, title }) {
  return (
    <aside className="sidebar">
      {title && <div className="sidebar-title">{title}</div>}
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {item.icon && <span className="sidebar-icon">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
