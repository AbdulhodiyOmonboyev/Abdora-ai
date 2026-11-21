import React from 'react';

/**
 * Abdora - Origami Fox Brand Logo Component
 * Standalone, transparent-background geometric fox emblem.
 * Perfectly calibrated for both Light and Dark modes.
 */
export const LogoIcon = ({
  size = 46,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none transition-transform duration-300 hover:scale-110 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={size}
        height={size}
        role="img"
        aria-label="Abdora Logo"
        className="w-full h-full overflow-visible filter drop-shadow-[0_2px_8px_rgba(230,85,0,0.25)] dark:drop-shadow-[0_0_14px_rgba(255,122,0,0.38)] transition-all duration-300"
      >
        {/* Outer Ears and Head Silhouette */}
        <polygon points="256.4,106.9 190.3,116.1 64.2,36.0 81.3,212.0 39.3,309.2 256.4,476.0" fill="#FF6A00" />
        <polygon points="255.6,106.9 321.7,116.1 447.8,36.0 430.7,212.0 472.7,309.2 255.6,476.0" fill="#E65500" />
        <polygon points="64.2,36.0 190.3,116.1 81.3,212.0" fill="#FF6A00" />
        <polygon points="447.8,36.0 321.7,116.1 430.7,212.0" fill="#E65500" />

        {/* Inner Ear Highlights */}
        <polygon points="91.8,83.3 141.7,142.4 105.0,183.1" fill="#EAEAE8" className="dark:fill-[#F4F4F3]" />
        <polygon points="420.2,83.3 370.3,142.4 407.0,183.1" fill="#E2E2E0" className="dark:fill-[#EBEBEA]" />

        {/* Forehead and Upper Face Facets */}
        <polygon points="256.3,106.9 190.3,116.1 81.3,212.0 131.2,286.9 189.0,322.3 225.8,393.3 256.3,384.1" fill="#FF7A00" />
        <polygon points="255.7,106.9 321.7,116.1 430.7,212.0 380.8,286.9 323.0,322.3 286.2,393.3 255.7,384.1" fill="#F25E00" />
        <polygon points="256.3,106.9 210.0,284.2 225.8,393.3 256.3,384.1" fill="#FF8208" />
        <polygon points="255.7,106.9 302.0,284.2 286.2,393.3 255.7,384.1" fill="#F76302" />

        {/* Cheek and Temple Facets */}
        <polygon points="81.3,212.0 39.3,309.2 131.2,286.9" fill="#FA6300" />
        <polygon points="430.7,212.0 472.7,309.2 380.8,286.9" fill="#DF5000" />
        <polygon points="39.3,309.2 165.4,344.7 208.7,414.3 256.3,437.9 256.3,476.0" fill="#FF6600" />
        <polygon points="472.7,309.2 346.6,344.7 303.3,414.3 255.7,437.9 255.7,476.0" fill="#DF5000" />

        {/* Center White Muzzle & Cheeks (Adaptive for light/dark) */}
        <polygon
          points="131.2,286.9 189.0,322.3 225.8,393.3 256.0,418.2 286.2,393.3 323.0,322.3 380.8,286.9 346.6,344.7 303.3,414.3 256.0,439.2 208.7,414.3 165.4,344.7"
          fill="#FFFFFF"
          className="dark:fill-[#FFFFFF]"
        />
        <polygon points="39.3,309.2 131.2,286.9 165.4,344.7" fill="#ECECEB" className="dark:fill-[#F5F5F4]" />
        <polygon points="472.7,309.2 380.8,286.9 346.6,344.7" fill="#E4E4E3" className="dark:fill-[#EDEDEC]" />

        {/* Eyes & Nose Details */}
        <polygon points="143.0,233.0 187.7,250.1 210.0,284.2 165.4,267.2" fill="#16171B" className="dark:fill-[#0F1014]" />
        <polygon points="369.0,233.0 324.3,250.1 302.0,284.2 346.6,267.2" fill="#16171B" className="dark:fill-[#0F1014]" />
        <polygon points="256.0,376.2 281.0,382.7 283.6,393.3 256.0,418.2 228.4,393.3 231.0,382.7" fill="#1A1B20" className="dark:fill-[#121318]" />
      </svg>
    </div>
  );
};

export const Logo = ({
  size = 46,
  variant = 'full', // 'icon' | 'full'
  subtitle = null,
  className = '',
}) => {
  if (variant === 'icon') {
    return <LogoIcon size={size} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon size={size} />
      <div className="flex flex-col justify-center">
        <span
          className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-none"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: `${Math.round(size * 0.52)}px`,
          }}
        >
          Abdora
        </span>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-1 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
