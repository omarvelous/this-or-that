const VARIANT_STYLES = {
  live: "bg-success-bg text-success-ink",
  active: "bg-success-bg text-success-ink",
  closed: "bg-sand text-muted",
  expired: "bg-sand text-muted",
  draft: "bg-option-a-tint text-option-a",
  deleted: "bg-error/10 text-error",
} as const;

type StatusVariant = keyof typeof VARIANT_STYLES;

interface StatusPillProps {
  variant: StatusVariant;
  label?: string;
  pulse?: boolean;
}

export function StatusPill({ variant, label, pulse }: StatusPillProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={`rounded-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {label ?? variant}
    </span>
  );
}
