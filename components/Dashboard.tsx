"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Report, Profile } from "@/types";

export default function Dashboard({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const isResponder = profile.role === "volunteer" || profile.role === "recycler" || profile.role === "ngo_admin";

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });

      // Residents see their own submissions; responders see the open queue
      // plus anything they've already claimed.
      if (!isResponder) {
        query = query.eq("reporter_id", profile.id);
      } else {
        query = query.or(`status.eq.open,claimed_by.eq.${profile.id}`);
      }

      const { data } = await query;
      if (data) setReports(data as Report[]);
      setLoading(false);
    }
    load();
  }, [supabase, profile.id, isResponder]);

  async function claim(reportId: string) {
    await supabase
      .from("reports")
      .update({ status: "claimed", claimed_by: profile.id, claimed_at: new Date().toISOString() })
      .eq("id", reportId);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "claimed", claimed_by: profile.id } : r))
    );
  }

  async function markCollected(reportId: string) {
    await supabase.from("reports").update({ status: "collected" }).eq("id", reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "collected" } : r)));
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  if (reports.length === 0) {
    return (
      <p className="text-slate-500">
        {isResponder ? "No open reports right now — nice." : "You haven't submitted any reports yet."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/report/${r.id}`} className="font-medium hover:underline">
                {r.location_description}
              </Link>
              <p className="text-sm text-slate-600">{r.description}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(r.created_at).toLocaleString()} · status: {r.status}
              </p>
            </div>
            {isResponder && r.status === "open" && (
              <button
                onClick={() => claim(r.id)}
                className="shrink-0 rounded-md bg-river-500 px-3 py-1.5 text-sm text-white"
              >
                Claim
              </button>
            )}
            {isResponder && r.status === "claimed" && r.claimed_by === profile.id && (
              <button
                onClick={() => markCollected(r.id)}
                className="shrink-0 rounded-md border px-3 py-1.5 text-sm"
              >
                Mark collected
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
