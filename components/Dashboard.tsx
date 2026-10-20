"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { COMMON_TAGS, getTagStyle } from "@/lib/tags";
import StatusBadge from "@/components/StatusBadge";
import { PlusIcon } from "@/components/icons";
import type { Report, Profile, ReportStatus } from "@/types";

export default function Dashboard({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const isResponder =
    profile.role === "volunteer" || profile.role === "recycler" || profile.role === "ngo_admin";

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
    const now = new Date().toISOString();
    await supabase
      .from("reports")
      .update({ status: "claimed", claimed_by: profile.id, claimed_at: now })
      .eq("id", reportId);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "claimed", claimed_by: profile.id, claimed_at: now } : r))
    );
  }

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchTag =
        tagFilter === "all" ||
        (Array.isArray(r.tags) &&
          r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
      return matchStatus && matchTag;
    });
  }, [reports, statusFilter, tagFilter]);

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
          {isResponder ? "No open reports in the queue right now." : "You haven't submitted any reports yet."}
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
    <div className="space-y-4">
      {/* Filtering Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              statusFilter === "open" ? "bg-white text-red-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter("claimed")}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              statusFilter === "claimed" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Claimed
          </button>
          <button
            onClick={() => setStatusFilter("collected")}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              statusFilter === "collected" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Collected
          </button>
        </div>

        {/* Tag Dropdown */}
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
        >
          <option value="all">All Category Tags</option>
          {COMMON_TAGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="card p-8 text-center text-xs text-slate-500">
          No reports match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((r) => (
            <div key={r.id} className="card !p-4 transition hover:border-slate-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/report/${r.id}`} className="font-bold text-slate-900 hover:underline">
                      {r.location_description}
                    </Link>
                    {r.proof_photo_url && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                        Proof Uploaded ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>

                  {/* Tags */}
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getTagStyle(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/report/${r.id}`}
                    className="btn-secondary !min-h-[36px] !py-1 !px-3 text-xs"
                  >
                    View Details
                  </Link>

                  {isResponder && r.status === "open" && (
                    <button
                      onClick={() => claim(r.id)}
                      className="btn-primary !min-h-[36px] !py-1 !px-3.5 text-xs font-semibold"
                    >
                      Claim
                    </button>
                  )}

                  {isResponder && r.status === "claimed" && r.claimed_by === profile.id && (
                    <Link
                      href={`/report/${r.id}`}
                      className="btn bg-amber-600 text-white hover:bg-amber-700 !min-h-[36px] !py-1 !px-3 text-xs font-semibold"
                    >
                      Submit Proof 📷
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
