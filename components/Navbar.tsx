"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import {
  CloseIcon,
  DropletIcon,
  GridIcon,
  HomeIcon,
  LogInIcon,
  MapPinIcon,
  MenuIcon,
  PlusIcon,
  RecycleIcon,
} from "@/components/icons";

const BASE_LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/#map", label: "Hotspot Map", Icon: MapPinIcon },
  { href: "/report", label: "Report an Issue", Icon: PlusIcon },
  { href: "/dashboard", label: "Dashboard", Icon: GridIcon },
  { href: "/partners", label: "Recycling Partners", Icon: RecycleIcon },
  { href: "/download", label: "Download Android App", Icon: DropletIcon },
];

export default function Navbar({
  signedIn,
  firstName,
  role,
}: {
  signedIn: boolean;
  firstName: string;
  role: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const greeting = `Hi, ${firstName || "there"}`;

  const links = [
    ...BASE_LINKS,
    ...(role === "ngo_admin"
      ? [{ href: "/admin", label: "Admin Console", Icon: GridIcon }]
      : []),
  ];

  // Close the menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  // While open: lock page scroll and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-river-400 to-river-600 text-white shadow-sm">
              <DropletIcon width={18} height={18} />
            </span>
            <span className="truncate font-bold tracking-tight text-river-700">
              Pune Civic<span className="hidden sm:inline"> Reporting</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/download"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              📥 Android App
            </Link>
            {role === "ngo_admin" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100"
              >
                ⚙️ Admin
              </Link>
            )}
            {signedIn ? (
              <span className="max-w-[9rem] truncate rounded-full bg-river-50 px-3 py-1.5 text-sm font-medium text-river-700">
                {greeting}
              </span>
            ) : (
              <Link href="/login" className="btn-primary !min-h-[40px] !px-4">
                Log in
              </Link>
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-fadein bg-slate-900/40 backdrop-blur-[2px]"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs animate-slidein flex-col bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">
                  {signedIn ? greeting : "Welcome"}
                </p>
                {signedIn && role && role !== "resident" ? (
                  <span className="mt-1 inline-block rounded-full bg-river-50 px-2.5 py-0.5 text-xs font-medium capitalize text-river-700">
                    {role.replace("_", " ")}
                  </span>
                ) : (
                  <p className="text-sm text-slate-500">
                    {signedIn ? "Resident" : "Log in to track your reports"}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {links.map(({ href, label, Icon }) => {
                const active = href === pathname;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
                      active
                        ? "bg-river-50 text-river-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={active ? "text-river-500" : "text-slate-400"} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 p-4">
              {signedIn ? (
                <SignOutButton />
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="btn-primary w-full">
                    <LogInIcon width={18} height={18} />
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-secondary w-full">
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
