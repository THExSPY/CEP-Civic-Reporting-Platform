"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/icons";

// Floating "Report" shortcut for phones, so the main action is always one
// tap away without opening the menu.
export default function ReportFab() {
  const pathname = usePathname();
  if (["/report", "/login", "/signup"].includes(pathname)) return null;

  return (
    <Link
      href="/report"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-river-500 px-5 font-semibold text-white shadow-lg shadow-river-500/40 active:scale-95 md:hidden"
    >
      <PlusIcon />
      Report
    </Link>
  );
}
