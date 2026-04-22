export function NoddicLoader({ size = 40 }: { size?: number }) {
  const r = size * 0.4;
  const ir = size * 0.14;
  const sw = Math.max(1.5, size * 0.05);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="noddic-loader">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3525cd" strokeWidth={sw} opacity="0.3" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3525cd" strokeWidth={sw} strokeDasharray={`${r * 1.2} ${r * Math.PI * 2}`} strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={ir} fill="#3525cd">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}