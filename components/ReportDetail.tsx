"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Report, Profile } from "@/types";

export default function ReportDetail({
  reportId,
  profile,
}: {
  reportId: string;
  profile: Profile | null;
}) {
  const supabase = createClient();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const isResponder =
    profile?.role === "volunteer" || profile?.role === "recycler" || profile?.role === "ngo_admin";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("reports").select("*").eq("id", reportId).single();
      setReport(data as Report | null);
      setLoading(false);
    }
    load();
  }, [supabase, reportId]);

  async function claim() {
    if (!profile) return;
    await supabase
      .from("reports")
      .update({ status: "claimed", claimed_by: profile.id, claimed_at: new Date().toISOString() })
      .eq("id", reportId);
    setReport((r) => (r ? { ...r, status: "claimed", claimed_by: profile.id } : r));
  }

  async function markCollected() {
    await supabase.from("reports").update({ status: "collected" }).eq("id", reportId);
    setReport((r) => (r ? { ...r, status: "collected" } : r));
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!report) return <p className="text-slate-500">Report not found.</p>;

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">{report.location_description}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
          {report.status}
        </span>
      </div>

      {report.photo_url && (
        <img
          src={report.photo_url}
          alt="Reported site"
          className="mb-4 max-h-80 w-full rounded-md object-cover"
        />
      )}

      <p className="mb-4 text-slate-700">{report.description}</p>

      <p className="mb-4 text-xs text-slate-400">
        Reported {report.reporter_name ? `by ${report.reporter_name} ` : ""}
        on {new Date(report.created_at).toLocaleString()}
      </p>

      {isResponder && report.status === "open" && (
        <button
          onClick={claim}
          className="rounded-md bg-river-500 px-4 py-2 text-sm text-white"
        >
          Claim this report
        </button>
      )}
      {isResponder && report.status === "claimed" && report.claimed_by === profile?.id && (
        <button
          onClick={markCollected}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Mark collected
        </button>
      )}
    </div>
  );
}
