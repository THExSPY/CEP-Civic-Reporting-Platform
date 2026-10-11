"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PartnerRegisterForm({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [materials, setMaterials] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from("recycling_partners").insert({
      profile_id: profileId,
      org_name: orgName,
      service_area: serviceArea,
      materials_accepted: materials.split(",").map((m) => m.trim()).filter(Boolean),
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        required
        placeholder="Organization name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="input"
      />
      <input
        placeholder="Service area, e.g. Kothrud, Karve Nagar"
        value={serviceArea}
        onChange={(e) => setServiceArea(e.target.value)}
        className="input"
      />
      <input
        placeholder="Materials accepted, comma separated (plastic, e-waste, paper)"
        value={materials}
        onChange={(e) => setMaterials(e.target.value)}
        className="input"
      />
      {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full sm:w-auto"
      >
        {submitting ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
