"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COMMON_TAGS, getTagStyle } from "@/lib/tags";
import StatusBadge from "@/components/StatusBadge";
import type { Report, Profile, UserRole, ReportStatus } from "@/types";

const ALL_ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "resident", label: "Resident", desc: "Can submit and track civic reports" },
  { value: "volunteer", label: "Volunteer", desc: "Can claim reports and submit cleanup proof" },
  { value: "recycler", label: "Recycling Partner", desc: "Can claim waste batches and register services" },
  { value: "ngo_admin", label: "NGO / Platform Admin", desc: "Full administrative access" },
];

export default function AdminDashboard({ adminProfile }: { adminProfile: Profile }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"reports" | "users">("reports");

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportFilterStatus, setReportFilterStatus] = useState<ReportStatus | "all">("all");
  const [reportFilterTag, setReportFilterTag] = useState<string>("all");
  const [reportSearch, setReportSearch] = useState("");

  // Users state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | "all">("all");

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load reports
  async function loadReports() {
    setLoadingReports(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReports(data as Report[]);
    setLoadingReports(false);
  }

  // Load users / profiles
  async function loadProfiles() {
    setLoadingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProfiles(data as Profile[]);
    setLoadingUsers(false);
  }

  useEffect(() => {
    loadReports();
    loadProfiles();
  }, []);

  // Update report status
  async function handleUpdateStatus(reportId: string, newStatus: ReportStatus) {
    const updateData: Partial<Report> = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("reports").update(updateData).eq("id", reportId);
    if (!error) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      showNotice(`Report status updated to ${newStatus}`);
    } else {
      showNotice(`Error: ${error.message}`);
    }
  }

  // Delete report
  async function handleDeleteReport(reportId: string) {
    if (!confirm("Are you sure you want to delete this report? This cannot be undone.")) {
      return;
    }
    const { error } = await supabase.from("reports").delete().eq("id", reportId);
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      showNotice("Report deleted.");
    } else {
      showNotice(`Error deleting report: ${error.message}`);
    }
  }

  // Update user role
  async function handleUpdateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      showNotice(`User role updated to ${newRole}`);
    } else {
      showNotice(`Error updating role: ${error.message}`);
    }
  }

  function showNotice(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = reportFilterStatus === "all" || r.status === reportFilterStatus;
      const matchTag =
        reportFilterTag === "all" ||
        (Array.isArray(r.tags) &&
          r.tags.some((t) => t.toLowerCase() === reportFilterTag.toLowerCase()));
      const matchSearch =
        !reportSearch ||
        r.location_description.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (r.reporter_name && r.reporter_name.toLowerCase().includes(reportSearch.toLowerCase()));
      return matchStatus && matchTag && matchSearch;
    });
  }, [reports, reportFilterStatus, reportFilterTag, reportSearch]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchRole = userRoleFilter === "all" || p.role === userRoleFilter;
      const matchSearch =
        !userSearch ||
        (p.full_name && p.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
        (p.organization_name &&
          p.organization_name.toLowerCase().includes(userSearch.toLowerCase())) ||
        p.id.toLowerCase().includes(userSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [profiles, userRoleFilter, userSearch]);

  return (
    <div className="space-y-5">
      {/* Admin Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-river-100 px-3 py-0.5 text-xs font-semibold text-river-800">
            Admin Console · {adminProfile.full_name || "Coordinator"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl mt-1">
            Platform Administration
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("reports")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "reports"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Reports Management ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            User Roles & Signups ({profiles.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl bg-slate-900 p-3 text-center text-xs font-medium text-white shadow-md animate-fadein">
          {actionMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: REPORTS MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="card !p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Search by location, keyword, or reporter name..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="input !py-2 text-xs flex-1"
              />
              <select
                value={reportFilterStatus}
                onChange={(e) => setReportFilterStatus(e.target.value as any)}
                className="input !py-2 text-xs sm:w-44"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="claimed">Claimed</option>
                <option value="collected">Collected (Review)</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={reportFilterTag}
                onChange={(e) => setReportFilterTag(e.target.value)}
                className="input !py-2 text-xs sm:w-48"
              >
                <option value="all">All Tags</option>
                {COMMON_TAGS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-28 animate-pulse !bg-slate-100/70" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              No reports match your filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div key={r.id} className="card !p-4 transition hover:border-slate-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/report/${r.id}`}
                          className="font-bold text-slate-900 hover:text-river-600 hover:underline"
                        >
                          {r.location_description}
                        </Link>
                        <StatusBadge status={r.status} />
                        {r.proof_photo_url && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                            Proof Attached ✓
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-xs text-slate-600">{r.description}</p>

                      {Array.isArray(r.tags) && r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {r.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${getTagStyle(
                                tag
                              )}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">
                        Submitted: {new Date(r.created_at).toLocaleString()}
                        {r.reporter_name && ` by ${r.reporter_name}`}
                      </p>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Change Status:</span>
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleUpdateStatus(r.id, e.target.value as ReportStatus)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm"
                        >
                          <option value="open">Open</option>
                          <option value="claimed">Claimed</option>
                          <option value="collected">Collected</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/report/${r.id}`}
                          className="btn-secondary !min-h-[30px] !py-1 !px-2.5 text-xs"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: USER ROLES & SIGNUPS */}
      {/* ============================================================ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="card !p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Search users by name, organization, or user ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input !py-2 text-xs flex-1"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="input !py-2 text-xs sm:w-44"
              >
                <option value="all">All Roles</option>
                <option value="resident">Residents</option>
                <option value="volunteer">Volunteers</option>
                <option value="recycler">Recyclers</option>
                <option value="ngo_admin">NGO Admins</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 animate-pulse !bg-slate-100/70" />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              No user profiles match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="card !p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">
                        {p.full_name || "Unnamed User"}
                      </p>
                      {p.organization_name && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          🏢 {p.organization_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      User ID: <code className="text-[10px]">{p.id.slice(0, 12)}…</code> · Joined{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Role Assignment Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Assign Role:</span>
                    <select
                      value={p.role}
                      onChange={(e) => handleUpdateRole(p.id, e.target.value as UserRole)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm ${
                        p.role === "ngo_admin"
                          ? "border-purple-300 bg-purple-50 text-purple-800"
                          : p.role === "volunteer"
                          ? "border-green-300 bg-green-50 text-green-800"
                          : p.role === "recycler"
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
