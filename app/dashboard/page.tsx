import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isResponder = ["volunteer", "recycler", "ngo_admin"].includes(profile.role);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">
        {isResponder ? "Open Reports Queue" : "Your Reports"}
      </h1>
      <p className="mb-6 text-slate-600">
        {isResponder
          ? "Claim nearby reports and mark them collected once handled."
          : "Track the status of issues you've reported."}
      </p>
      <Dashboard profile={profile} />
    </div>
  );
}
