import type { ReportStatus } from "@/types";

const STYLES: Record<ReportStatus, { dot: string; pill: string; label: string }> = {
  open: { dot: "bg-red-500", pill: "bg-red-50 text-red-700", label: "Open" },
  claimed: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", label: "Claimed" },
  collected: { dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700", label: "Collected" },
  resolved: { dot: "bg-green-500", pill: "bg-green-50 text-green-700", label: "Resolved" },
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const s = STYLES[status] ?? STYLES.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
