const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

interface OptionBadgeProps {
  side: "a" | "b";
  size?: keyof typeof SIZES;
}

export function OptionBadge({ side, size = "md" }: OptionBadgeProps) {
  const bg = side === "a" ? "bg-option-a" : "bg-option-b";
  const sizeClass = SIZES[size];
  const label = side === "a" ? "A" : "B";

  return (
    <span
      className={`${bg} ${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
    >
      {label}
    </span>
  );
}
