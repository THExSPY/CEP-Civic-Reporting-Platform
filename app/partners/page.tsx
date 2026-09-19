import { createClient } from "@/lib/supabase/server";
import PartnerRegisterForm from "@/components/PartnerRegisterForm";

export default async function PartnersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: partners } = await supabase
    .from("recycling_partners")
    .select("*")
    .order("created_at", { ascending: false });

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Recycling Partners</h1>
      <p className="mb-6 text-slate-600">
        Verified recycling companies and collection points across Pune. They
        can claim nearby reports directly from the dashboard.
      </p>

      <div className="mb-8 space-y-3">
        {partners && partners.length > 0 ? (
          partners.map((p) => (
            <div key={p.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2">
                <p className="font-medium">{p.org_name}</p>
                {p.verified && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    Verified
                  </span>
                )}
              </div>
              {p.service_area && (
                <p className="text-sm text-slate-600">Serves: {p.service_area}</p>
              )}
              {p.materials_accepted?.length > 0 && (
                <p className="text-xs text-slate-400">
                  Accepts: {p.materials_accepted.join(", ")}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500">No partners registered yet — be the first.</p>
        )}
      </div>

      {profile?.role === "recycler" && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Register your organization</h2>
          <PartnerRegisterForm profileId={profile.id} />
        </>
      )}
    </div>
  );
}
