import PartnerRegisterForm from "@/components/PartnerRegisterForm";
import { getSessionContext } from "@/lib/auth";

export default async function PartnersPage() {
  const { supabase, profile } = await getSessionContext();

  const { data: partners } = await supabase
    .from("recycling_partners")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Recycling Partners</h1>
      <p className="mb-5 text-slate-600">
        Verified recycling companies and collection points across Pune. They
        can claim nearby reports directly from the dashboard.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {partners && partners.length > 0 ? (
          partners.map((p) => (
            <div key={p.id} className="card !p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.org_name}</p>
                {p.verified && (
                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    ✓ Verified
                  </span>
                )}
              </div>
              {p.service_area && (
                <p className="mt-1 text-sm text-slate-600">Serves: {p.service_area}</p>
              )}
              {p.materials_accepted?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.materials_accepted.map((m: string) => (
                    <span
                      key={m}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500 sm:col-span-2">
            No partners registered yet — be the first.
          </p>
        )}
      </div>

      {profile?.role === "recycler" && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Register your organization</h2>
          <PartnerRegisterForm profileId={profile.id} />
        </div>
      )}
    </div>
  );
}
