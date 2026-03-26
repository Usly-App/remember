import Link from 'next/link';

export function NoddicLogo({
  href = '/',
  size = 'default',
}: {
  href?: string;
  size?: 'small' | 'default' | 'large';
}) {
  const dimensions = {
    small: { icon: 24, text: 'text-lg', gap: 'gap-2', radius: 6, fontSize: 13, fontWeight: 700 },
    default: { icon: 32, text: 'text-2xl', gap: 'gap-2.5', radius: 8, fontSize: 17, fontWeight: 700 },
    large: { icon: 44, text: 'text-3xl', gap: 'gap-3', radius: 10, fontSize: 24, fontWeight: 800 },
  };

  const d = dimensions[size];

  return (
    <Link href={href} className={`flex items-center ${d.gap} group`}>
      <svg
        width={d.icon}
        height={d.icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect
          x="0"
          y="0"
          width="44"
          height="44"
          rx={d.radius}
          fill="url(#noddic-grad)"
        />
        <text
          x="22"
          y="30"
          textAnchor="middle"
          fill="white"
          fontSize={d.fontSize}
          fontWeight={d.fontWeight}
          fontFamily="Manrope, system-ui, sans-serif"
        >
          N
        </text>
        <defs>
          <linearGradient
            id="noddic-grad"
            x1="0"
            y1="0"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3525cd" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`font-headline font-bold ${d.text} tracking-tight text-primary`}
      >
        Noddic
      </span>
    </Link>
  );
}