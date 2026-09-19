import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar({
  user,
  profile,
}: {
  user: User | null;
  profile: Profile | null;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-river-600">
          🌊 Pune Civic Reporting
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/map">Hotspot Map</Link>
          <Link href="/report">Report an Issue</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/partners">Recycling Partners</Link>

          {user ? (
            <div className="flex items-center gap-3 border-l pl-4">
              <span className="text-slate-500">
                {profile?.full_name || user.email}
                {profile?.role && profile.role !== "resident" && (
                  <span className="ml-1 rounded-full bg-river-50 px-2 py-0.5 text-xs text-river-600">
                    {profile.role}
                  </span>
                )}
              </span>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-river-500 px-3 py-1.5 text-white"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
