import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "warning" | "danger" | "neutral";

const STATUS_TONES: Record<StatusBadgeTone, { dot: string; background: string; foreground: string }> = {
  success: {
    dot: "#2FA35E",
    background: "#E7F5EC",
    foreground: "#1F7A45",
  },
  warning: {
    dot: "#C28A1D",
    background: "#FBF2DC",
    foreground: "#8C6A1F",
  },
  danger: {
    dot: "#B94A34",
    background: "#FBEAE3",
    foreground: "#8C3A1F",
  },
  neutral: {
    dot: "#A6A399",
    background: "#F1EFEA",
    foreground: "#6B6960",
  },
};

export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusBadgeTone;
  label: string;
  className?: string;
}) {
  const colors = STATUS_TONES[tone];

  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium", className)}
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {label}
    </span>
  );
}
