import { redirect } from "next/navigation";
import Link from "next/link";
import AdminDashboard from "@/components/AdminDashboard";
import { getSessionContext } from "@/lib/auth";

export const metadata = {
  title: "Admin Console | Pune Civic Reporting Platform",
};

export default async function AdminPage() {
  const { user, profile } = await getSessionContext();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "ngo_admin";

  // Check if user has admin privileges
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md pt-8 text-center space-y-4">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
          🔒
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Access Required
        </h1>
        <p className="text-sm text-slate-600">
          Your current account role is{" "}
          <span className="font-semibold capitalize text-slate-800">
            {profile?.role || "resident"}
          </span>
          . The Admin Console is restricted to users with the{" "}
          <strong>Platform Admin</strong> role.
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-left text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Need platform admin access?</p>
          <p>
            An existing administrator can grant you the <code>admin</code> role from their User Roles tab, or you can update your role in the Supabase SQL Editor:
          </p>
          <pre className="rounded bg-slate-200/70 p-2 font-mono text-[11px] overflow-x-auto">
            {`UPDATE profiles SET role = 'admin' WHERE id = '${user.id}';`}
          </pre>
        </div>

        <Link href="/" className="btn-secondary w-full">
          Return to Map
        </Link>
      </div>
    );
  }

  return <AdminDashboard adminProfile={profile} />;
}
