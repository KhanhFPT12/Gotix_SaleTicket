import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./PageTransition.css";

export default function PageTransition() {
  const { pathname } = useLocation();
  const [tick, setTick]   = useState(0);
  const [show, setShow]   = useState(false);
  const mounted           = useRef(false);

  useEffect(() => {
    // Skip on first mount — no animation on initial page load
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setTick(n => n + 1);   // bump key → restart CSS animation
    setShow(true);
    const t = setTimeout(() => setShow(false), 860);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="pt-layer" aria-hidden="true">
      <div key={tick} className="pt-ticket-wrap">
        <TicketSVG />
      </div>
    </div>
  );
}

function TicketSVG() {
  return (
    <svg
      width="188"
      height="68"
      viewBox="0 0 188 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pt-ticket-svg"
    >
      {/*
        Ticket shape:
          - Width 188, Height 68
          - Rounded corners r=10
          - Semicircle notches on left & right at y-center=34, r=11

        Right notch: A 11 11 0 0 0 188 45  (CCW arc from y=23 to y=45 → goes left to x=177)
        Left notch:  A 11 11 0 0 0 0 23    (CCW arc from y=45 to y=23 → goes right to x=11)
      */}
      <path
        d="M10,0 L178,0 Q188,0 188,10 L188,23 A11,11,0,0,0,188,45 L188,58 Q188,68 178,68 L10,68 Q0,68 0,58 L0,45 A11,11,0,0,0,0,23 L0,10 Q0,0 10,0 Z"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1"
      />

      {/* Dashed tear line */}
      <line
        x1="124" y1="12" x2="124" y2="56"
        stroke="#e2e8f0" strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* GoTix branding — left zone */}
      <text
        x="16" y="32"
        fontFamily="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        fontSize="14" fontWeight="800" fill="#1e293b"
      >
        GoTix
      </text>
      <text
        x="16" y="50"
        fontFamily="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        fontSize="9" fill="#94a3b8" letterSpacing="0.8"
      >
        VÉ PHIM
      </text>

      {/* Cinema screen icon — right zone (safe from notch at x=177) */}
      <rect
        x="133" y="17" width="40" height="34" rx="4"
        fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"
      />
      {/* Play triangle */}
      <polygon points="144,26 144,42 158,34" fill="#cbd5e1" />
      {/* Bottom label */}
      <text
        x="153" y="59"
        fontFamily="system-ui,-apple-system,sans-serif"
        fontSize="7" fill="#cbd5e1"
        textAnchor="middle"
      >
        ••••••
      </text>
    </svg>
  );
}
