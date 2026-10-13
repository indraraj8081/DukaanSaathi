const ShopArt = ({ className = "h-64 w-auto" }) => (
  <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
    <circle cx="40" cy="140" r="28" fill="#86efac" />
    <rect x="37" y="162" width="6" height="40" fill="#92400e" />
    <circle cx="285" cy="130" r="32" fill="#4ade80" />
    <rect x="282" y="156" width="6" height="46" fill="#92400e" />
    <rect x="70" y="100" width="180" height="102" rx="4" fill="#fef3c7" stroke="#d97706" strokeOpacity="0.4" />
    <rect x="58" y="72" width="204" height="34" rx="4" fill="#15803d" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={58 + i * 25.5} y="72" width="12.75" height="34" fill="#fff" opacity="0.9" />
    ))}
    <rect x="95" y="28" width="130" height="32" rx="6" fill="#166534" />
    <text x="160" y="50" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">Dukan Saathi</text>
    <rect x="84" y="120" width="52" height="46" fill="#bfdbfe" />
    <rect x="184" y="120" width="52" height="46" fill="#bfdbfe" />
    <rect x="144" y="124" width="32" height="78" fill="#166534" />
    <rect x="70" y="180" width="44" height="22" fill="#f59e0b" />
    <rect x="206" y="180" width="44" height="22" fill="#f97316" />
  </svg>
);

export default ShopArt;