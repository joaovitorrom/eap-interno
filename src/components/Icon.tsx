// Material Symbols Outlined icon component

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}

export default function Icon({ name, filled, className = '', size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'fill' : ''} ${className}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}
