"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeftIcon } from "@/components/icons";
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

  if (loading) return <div className="card h-48 animate-pulse !bg-slate-100/70" />;
  if (!report) return <p className="text-slate-500">Report not found.</p>;

  return (
    <div>
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-river-600 hover:underline"
      >
        <ArrowLeftIcon width={16} height={16} />
        Back to map
      </Link>

      <div className="card !p-0 overflow-hidden">
        {report.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.photo_url}
            alt="Reported site"
            className="max-h-80 w-full object-cover"
          />
        )}
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-snug">{report.location_description}</h1>
            <StatusBadge status={report.status} />
          </div>

          <p className="mb-4 text-slate-700">{report.description}</p>

          <p className="mb-4 text-xs text-slate-400">
            Reported {report.reporter_name ? `by ${report.reporter_name} ` : ""}
            on {new Date(report.created_at).toLocaleString()}
          </p>

          {isResponder && report.status === "open" && (
            <button onClick={claim} className="btn-primary w-full">
              Claim this report
            </button>
          )}
          {isResponder && report.status === "claimed" && report.claimed_by === profile?.id && (
            <button onClick={markCollected} className="btn-secondary w-full">
              Mark collected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
