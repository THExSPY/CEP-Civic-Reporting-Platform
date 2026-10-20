import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { getSessionContext } from "@/lib/auth";

export default async function DashboardPage() {
  const { user, profile } = await getSessionContext();

  // Only a missing *session* sends you to log in. A missing profile row is
  // repaired in getSessionContext, so it never bounces you to the login page.
  if (!user) redirect("/login?next=/dashboard");

  const role = profile?.role ?? "resident";
  const isResponder = ["volunteer", "recycler", "ngo", "admin", "ngo_admin"].includes(role);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {isResponder ? "Open Reports Queue" : "Your Reports"}
      </h1>
      <p className="mb-5 text-slate-600">
        {isResponder
          ? "Claim nearby reports and mark them collected once handled."
          : "Track the status of issues you've reported."}
      </p>
      {profile ? (
        <Dashboard profile={profile} />
      ) : (
        <p className="text-slate-500">
          We couldn&apos;t load your profile just now — please refresh the page.
        </p>
      )}
    </div>
  );
}
