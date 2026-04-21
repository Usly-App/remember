import Link from 'next/link';

export function NoddicLogo({
  href = '/',
  size = 'default',
}: {
  href?: string;
  size?: 'small' | 'default' | 'large';
}) {
  const dimensions = {
    small: { icon: 24, text: 'text-lg', gap: 'gap-2' },
    default: { icon: 32, text: 'text-2xl', gap: 'gap-2.5' },
    large: { icon: 44, text: 'text-3xl', gap: 'gap-3' },
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
        <circle cx="22" cy="22" r="20" stroke="url(#noddic-grad)" strokeWidth="2.5" fill="none" />
        <circle cx="22" cy="22" r="7" fill="url(#noddic-grad)" />
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