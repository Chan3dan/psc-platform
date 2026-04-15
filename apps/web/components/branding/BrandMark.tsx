import Image from 'next/image';
import Link from 'next/link';

export function BrandMark({
  href = '/',
  name,
  logoUrl,
  subtitle,
  compact = false,
  admin = false,
}: {
  href?: string;
  name: string;
  logoUrl: string;
  subtitle?: string;
  compact?: boolean;
  admin?: boolean;
}) {
  const title = admin ? `${name} Admin` : name;

  return (
    <Link href={href} className="flex items-center gap-3 min-w-0">
      <div className={`${compact ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl'} overflow-hidden border border-[var(--line)] bg-white shrink-0`}>
        <Image
          src={logoUrl}
          alt={name}
          width={96}
          height={96}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-[var(--text)] truncate`}>
          {title}
        </p>
        {subtitle ? (
          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
