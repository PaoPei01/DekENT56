type Gear13IconProps = {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
};

const teeth = Array.from({ length: 13 }, (_, index) => index * (360 / 13));

export function Gear13Icon({ size = 24, className, 'aria-hidden': ariaHidden = true }: Gear13IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <g transform="translate(32 32)">
        {teeth.map((angle) => (
          <rect
            key={angle}
            x="-2.6"
            y="-30"
            width="5.2"
            height="10"
            rx="1.8"
            fill="currentColor"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
