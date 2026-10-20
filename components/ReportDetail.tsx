"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { getTagStyle } from "@/lib/tags";
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
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proof upload form state
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofDesc, setProofDesc] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.role === "ngo_admin";
  const isNGO = profile?.role === "ngo";
  const isResponder =
    profile?.role === "volunteer" || profile?.role === "recycler" || isNGO || isAdmin;
  const isClaimant = profile && report?.claimed_by === profile.id;
  const isReporter = profile && report?.reporter_id === profile.id;

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();
      if (!error && data) {
        setReport(data as Report);
      }
      setLoading(false);
    }
    load();
  }, [supabase, reportId]);

  async function claim() {
    if (!profile) return;
    setActionLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("reports")
      .update({ status: "claimed", claimed_by: profile.id, claimed_at: now })
      .eq("id", reportId);

    setActionLoading(false);
    if (!error) {
      setReport((r) => (r ? { ...r, status: "claimed", claimed_by: profile.id, claimed_at: now } : r));
    } else {
      setError(error.message);
    }
  }

  async function handleProofPhotoChange(file: File | null) {
    if (!file) {
      setProofPhoto(null);
      setProofPreview(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, `proof-${reportId}.jpg`);
      setProofPhoto(compressed);
      setProofPreview(URL.createObjectURL(compressed));
    } catch (e) {
      console.warn("Proof image compression warning:", e);
      setProofPhoto(file);
      setProofPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  async function submitCleanupProof(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !proofPhoto) {
      setError("Please attach a photo proving the waste has been cleaned up.");
      return;
    }

    setActionLoading(true);
    setError(null);

    // 1. Upload proof photo
    const fileExt = proofPhoto.name.split(".").pop() || "jpg";
    const filePath = `proof-${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(filePath, proofPhoto, { contentType: "image/jpeg" });

    if (uploadError) {
      setError(`Proof photo upload failed: ${uploadError.message}`);
      setActionLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("report-photos")
      .getPublicUrl(filePath);

    const proofPhotoUrl = publicUrlData.publicUrl;
    const now = new Date().toISOString();

    // 2. Update report with proof and set status to collected (awaiting review)
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "collected",
        proof_photo_url: proofPhotoUrl,
        proof_description: proofDesc || null,
        proof_submitted_at: now,
        proof_submitted_by: profile.id,
      })
      .eq("id", reportId);

    setActionLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setReport((r) =>
      r
        ? {
            ...r,
            status: "collected",
            proof_photo_url: proofPhotoUrl,
            proof_description: proofDesc,
            proof_submitted_at: now,
            proof_submitted_by: profile.id,
          }
        : r
    );
    setShowProofForm(false);
  }

  async function approveAndResolve() {
    if (!profile) return;
    setActionLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved", resolved_at: now })
      .eq("id", reportId);

    setActionLoading(false);
    if (!error) {
      setReport((r) => (r ? { ...r, status: "resolved", resolved_at: now } : r));
    } else {
      setError(error.message);
    }
  }

  async function reopenReport() {
    if (!profile) return;
    setActionLoading(true);
    const { error } = await supabase
      .from("reports")
      .update({ status: "claimed" })
      .eq("id", reportId);

    setActionLoading(false);
    if (!error) {
      setReport((r) => (r ? { ...r, status: "claimed" } : r));
    } else {
      setError(error.message);
    }
  }

  if (loading) return <div className="card h-48 animate-pulse !bg-slate-100/70" />;
  if (!report) return <p className="text-slate-500">Report not found.</p>;

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-river-600 hover:underline"
      >
        <ArrowLeftIcon width={16} height={16} />
        Back to map
      </Link>

      <div className="card !p-0 overflow-hidden">
        {/* Before / Initial Photo */}
        {report.photo_url && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.photo_url}
              alt="Reported site"
              className="max-h-80 w-full object-cover"
            />
            <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              Initial Report Photo
            </span>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                {report.location_description}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Reported {report.reporter_name ? `by ${report.reporter_name} ` : ""}
                on {new Date(report.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          {/* Tags */}
          {Array.isArray(report.tags) && report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${getTagStyle(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-slate-700 leading-relaxed">{report.description}</p>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {/* Action: Open Report -> Claim */}
          {isResponder && report.status === "open" && (
            <div className="rounded-2xl border border-river-100 bg-river-50/50 p-4">
              <p className="font-semibold text-river-900 text-sm">Ready to handle this hotspot?</p>
              <p className="text-xs text-river-700 mt-0.5">
                Claiming notifies other volunteers and lets you log your cleanup proof.
              </p>
              <button
                onClick={claim}
                disabled={actionLoading}
                className="btn-primary mt-3 w-full !py-2.5"
              >
                {actionLoading ? "Claiming…" : "Claim this report"}
              </button>
            </div>
          )}

          {/* Action: Claimed Report -> Submit Cleanup Proof */}
          {(isClaimant || isAdmin) && report.status === "claimed" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Hotspot Claimed</p>
                  <p className="text-xs text-amber-700">
                    Cleaned up this location? Upload a photo as proof of collection.
                  </p>
                </div>
                {!showProofForm && (
                  <button
                    onClick={() => setShowProofForm(true)}
                    className="btn-primary !min-h-[38px] !px-3 !py-1 text-xs"
                  >
                    Submit Proof
                  </button>
                )}
              </div>

              {showProofForm && (
                <form onSubmit={submitCleanupProof} className="space-y-3 pt-2">
                  <div>
                    <label className="label !text-xs font-semibold text-slate-800">
                      Cleanup Proof Photo (Required)
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={(e) => handleProofPhotoChange(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-river-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    {compressing && (
                      <p className="mt-1 text-xs text-river-600 animate-pulse">
                        ⚡ Optimizing cleanup photo...
                      </p>
                    )}
                    {proofPreview && !compressing && (
                      <div className="mt-2 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proofPreview}
                          alt="Proof preview"
                          className="h-16 w-20 rounded-lg object-cover border border-slate-300"
                        />
                        <span className="text-xs text-slate-500">
                          Ready ({proofPhoto ? Math.round(proofPhoto.size / 1024) : 0} KB)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label !text-xs font-semibold text-slate-800">
                      Cleanup Notes / Quantity Handled (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={proofDesc}
                      onChange={(e) => setProofDesc(e.target.value)}
                      placeholder="e.g. Cleared 6 bags of plastic waste from riverbank; handed over to recycling partner."
                      className="input !text-xs"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={actionLoading || compressing}
                      className="btn-primary flex-1 !min-h-[38px] !py-2 text-xs"
                    >
                      {actionLoading ? "Submitting Proof…" : "Submit Proof & Mark Collected"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProofForm(false)}
                      className="btn-secondary !min-h-[38px] !py-2 !px-3 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Section: Cleanup Proof Display (Before & After) */}
          {report.proof_photo_url && (
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-[11px]">✓</span>
                  Cleanup Proof Submitted
                </span>
                {report.proof_submitted_at && (
                  <span className="text-xs text-green-700">
                    {new Date(report.proof_submitted_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>

              {/* Side-by-side or stacked Before & After */}
              <div className="grid gap-3 sm:grid-cols-2">
                {report.photo_url && (
                  <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-red-600">
                      Before (Reported Hazard)
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.photo_url}
                      alt="Before cleanup"
                      className="h-36 w-full rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="rounded-xl border border-green-200 bg-white p-2 text-center">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-green-700">
                    After (Cleaned Site)
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.proof_photo_url}
                    alt="After cleanup proof"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                </div>
              </div>

              {report.proof_description && (
                <p className="rounded-lg bg-white/80 p-2.5 text-xs text-slate-700 border border-green-100">
                  <strong>Notes:</strong> {report.proof_description}
                </p>
              )}
            </div>
          )}

          {/* Section: Review and Verify (For Reporter, NGO, or Admin) */}
          {report.status === "collected" && (isReporter || isNGO || isAdmin) && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <p className="font-bold text-blue-900 text-sm">Review Cleanup</p>
              <p className="text-xs text-blue-700">
                Please review the proof above. Does the site look adequately cleaned up?
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={approveAndResolve}
                  disabled={actionLoading}
                  className="btn bg-green-600 text-white hover:bg-green-700 flex-1 !min-h-[40px] text-xs font-semibold"
                >
                  ✓ Approve & Mark Resolved
                </button>
                <button
                  onClick={reopenReport}
                  disabled={actionLoading}
                  className="btn-secondary !min-h-[40px] text-xs text-amber-800"
                >
                  Needs More Work (Reopen)
                </button>
              </div>
            </div>
          )}

          {/* Resolved celebration notice */}
          {report.status === "resolved" && (
            <div className="rounded-xl bg-green-100/70 p-3.5 text-center text-xs text-green-900 font-medium">
              🌱 This hotspot was successfully resolved and verified! Thank you to the Pune civic community.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
