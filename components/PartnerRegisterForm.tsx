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
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <input
        required
        placeholder="Organization name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        placeholder="Service area, e.g. Kothrud, Karve Nagar"
        value={serviceArea}
        onChange={(e) => setServiceArea(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        placeholder="Materials accepted, comma separated (plastic, e-waste, paper)"
        value={materials}
        onChange={(e) => setMaterials(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-river-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
