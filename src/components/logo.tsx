import Image from 'next/image';
import type { SVGProps } from 'react';

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function CosmofyLogo({ size = 'md', className, ...props }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src="/img/logo/cosmofy.svg"
        alt="Cosmofy Logo"
        fill
        sizes="(max-width: 768px) 32px, (max-width: 1200px) 40px, 56px"
        className="object-contain"
        priority
      />
    </div>
  );
}
