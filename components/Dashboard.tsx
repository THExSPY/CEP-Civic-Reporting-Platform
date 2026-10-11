"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { PlusIcon } from "@/components/icons";
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-24 animate-pulse !bg-slate-100/70" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="card flex flex-col items-center py-10 text-center">
        <p className="text-slate-500">
          {isResponder ? "No open reports right now — nice." : "You haven't submitted any reports yet."}
        </p>
        {!isResponder && (
          <Link href="/report" className="btn-primary mt-4">
            <PlusIcon width={18} height={18} />
            Report an Issue
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="card !p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/report/${r.id}`} className="font-semibold hover:underline">
                {r.location_description}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{r.description}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
            {isResponder && r.status === "open" && (
              <button onClick={() => claim(r.id)} className="btn-primary !min-h-[40px] !px-4">
                Claim
              </button>
            )}
            {isResponder && r.status === "claimed" && r.claimed_by === profile.id && (
              <button onClick={() => markCollected(r.id)} className="btn-secondary !min-h-[40px] !px-4">
                Mark collected
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
