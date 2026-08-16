import logoLeaf from '../assets/logo-leaf.png';

type BrandLogoProps = {
  className?: string;
  size?: number | string;
  alt?: string;
  decorative?: boolean;
};

/** Official Smart Agro circuit-leaf mark from the brand lockup. */
export function BrandLogo({
  className,
  size = 32,
  alt = 'Smart Agro',
  decorative = false,
}: BrandLogoProps) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <img
      src={logoLeaf}
      alt={decorative ? '' : alt}
      className={className ? `brand-logo ${className}` : 'brand-logo'}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      style={{ width: dim, height: dim, objectFit: 'contain', display: 'block' }}
      draggable={false}
      aria-hidden={decorative || undefined}
    />
  );
}

export default BrandLogo;
