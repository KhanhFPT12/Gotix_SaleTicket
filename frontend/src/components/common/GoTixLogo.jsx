export default function GoTixLogo({ height = 44, className = "" }) {
  return (
    <svg
      height={height}
      viewBox="0 0 158 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GoTix"
      style={{ display: "block" }}
    >
      {/* ── Ticket body ── */}
      <path
        d="M5,1 H45 Q50,1 50,6 V17 A5.5,5.5,0,0,0,50,33 V46 Q50,51 45,51 H5 Q0,51 0,46 V33 A5.5,5.5,0,0,0,0,17 V6 Q0,1 5,1 Z"
        fill="#1E293B"
      />

      {/* ── Red corner accent ── */}
      <path d="M27,1 H47 Q50,1 50,4 V27 Z" fill="#C53030" />

      {/* ── White circle ── */}
      <circle cx="25" cy="26" r="11.5" stroke="white" strokeWidth="1.8" fill="none" />

      {/* ── G letter ── */}
      <text
        x="25" y="31"
        textAnchor="middle"
        fontFamily="Georgia,'Times New Roman',serif"
        fontSize="15"
        fontWeight="700"
        fill="white"
      >
        G
      </text>

      {/* ── Perforations (right edge of ticket) ── */}
      <circle cx="50" cy="14" r="2" fill="#334155" />
      <circle cx="50" cy="21" r="2" fill="#334155" />
      <circle cx="50" cy="32" r="2" fill="#334155" />
      <circle cx="50" cy="39" r="2" fill="#334155" />

      {/* ── Brand text ── */}
      <text
        x="62" y="25"
        fontFamily="'Arial Black','Arial Bold',Arial,system-ui,sans-serif"
        fontSize="20"
        fontWeight="900"
        fill="#1E293B"
        letterSpacing="0.5"
      >
        GO
      </text>
      <text
        x="100" y="25"
        fontFamily="'Arial Black','Arial Bold',Arial,system-ui,sans-serif"
        fontSize="20"
        fontWeight="900"
        fill="#C53030"
        letterSpacing="0.5"
      >
        TIX
      </text>

      {/* ── Tagline ── */}
      <text
        x="62" y="39"
        fontFamily="Arial,system-ui,sans-serif"
        fontSize="7.5"
        fill="#94A3B8"
        letterSpacing="0.6"
      >
        MUA DỄ DÀNG – PASS AN TOÀN
      </text>
    </svg>
  );
}
