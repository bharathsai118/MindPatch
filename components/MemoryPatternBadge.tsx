import { MISTAKE_LABELS, type MistakeType } from "@/lib/types";

type MemoryPatternBadgeProps = {
  type: string;
  count?: number;
  compact?: boolean;
};

export function MemoryPatternBadge({
  type,
  count,
  compact = false
}: MemoryPatternBadgeProps) {
  const label = MISTAKE_LABELS[type as MistakeType] ?? type.replace(/_/g, " ");
  return (
    <div
      className={`inline-flex items-center justify-between gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 ${
        compact ? "" : "w-full"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-white px-2 py-0.5 text-slate-500 ring-1 ring-slate-200">
          {count}
        </span>
      ) : null}
    </div>
  );
}
