import Image from 'next/image';
import Link from 'next/link';

export function BrandMark({
  href = '/',
  name,
  logoUrl,
  subtitle,
  compact = false,
  admin = false,
  hideSubtitleOnMobile = false,
}: {
  href?: string;
  name: string;
  logoUrl: string;
  subtitle?: string;
  compact?: boolean;
  admin?: boolean;
  hideSubtitleOnMobile?: boolean;
}) {
  const title = admin ? `${name} Admin` : name;
  const isDataUrl = logoUrl.startsWith('data:');

  return (
    <Link href={href} className="flex items-center gap-3 min-w-0 max-w-full">
      <div className={`${compact ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'} overflow-hidden border border-[var(--line)] bg-white shrink-0 shadow-sm`}>
        <Image
          src={logoUrl}
          alt={name}
          width={96}
          height={96}
          className="h-full w-full object-contain"
          unoptimized={isDataUrl}
        />
      </div>
      <div className="min-w-0 max-w-full">
        <p className={`${compact ? 'text-base' : 'text-lg'} font-bold text-[var(--text)] leading-tight break-words`}>
          {title}
        </p>
        {subtitle ? (
          <p className={`${hideSubtitleOnMobile ? 'hidden sm:block' : 'block'} ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} text-[var(--muted)] mt-0.5 leading-snug break-words`}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
