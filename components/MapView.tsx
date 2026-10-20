"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { createClient } from "@/lib/supabase/client";
import { COMMON_TAGS, getTagStyle } from "@/lib/tags";
import StatusBadge from "@/components/StatusBadge";
import { CloseIcon } from "@/components/icons";
import type { ReportPoint, ReportStatus } from "@/types";

const STATUS_META: { key: ReportStatus; label: string; color: string }[] = [
  { key: "open", label: "Open", color: "#dc2626" },
  { key: "claimed", label: "Claimed", color: "#d97706" },
  { key: "collected", label: "Collected", color: "#2563eb" },
  { key: "resolved", label: "Resolved", color: "#16a34a" },
];
const COLOR: Record<string, string> = Object.fromEntries(
  STATUS_META.map((s) => [s.key, s.color])
);

// Centered on Pune
const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

function ScrollZoomOnClick() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const on = () => map.scrollWheelZoom.enable();
    const off = () => map.scrollWheelZoom.disable();
    map.on("click", on);
    map.on("mouseout", off);
    return () => {
      map.off("click", on);
      map.off("mouseout", off);
    };
  }, [map]);
  return null;
}

export default function MapView() {
  const [points, setPoints] = useState<ReportPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ReportPoint | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("report_points").select("*");
      if (data) setPoints(data as ReportPoint[]);
    }
    load();

    // Live updates — new reports appear on everyone's map without a refresh
    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Status counts (total across dataset)
  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, claimed: 0, collected: 0, resolved: 0 };
    for (const p of points) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [points]);

  // Filtered points by active status and active tag
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      const matchStatus = selectedStatus === "all" || p.status === selectedStatus;
      const matchTag =
        selectedTag === "all" ||
        (Array.isArray(p.tags) &&
          p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
      return matchStatus && matchTag;
    });
  }, [points, selectedStatus, selectedTag]);

  return (
    <div className="space-y-3">
      {/* Status Counters / Quick Filters */}
      <div className="grid grid-cols-4 gap-2">
        {STATUS_META.map((s) => {
          const isActive = selectedStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStatus(isActive ? "all" : s.key)}
              className={`rounded-xl border p-2 text-center transition ${
                isActive
                  ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                  : "border-slate-100 bg-slate-50 hover:bg-slate-100/80"
              }`}
            >
              <p
                className={`text-xl font-bold leading-none ${
                  isActive ? "text-white" : ""
                }`}
                style={{ color: isActive ? undefined : s.color }}
              >
                {counts[s.key] ?? 0}
              </p>
              <p
                className={`mt-1 flex items-center justify-center gap-1 text-[11px] font-medium ${
                  isActive ? "text-slate-200" : "text-slate-500"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter by Tag Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="shrink-0 font-medium text-slate-500 mr-1">Filter:</span>
        <button
          onClick={() => {
            setSelectedTag("all");
            setSelectedStatus("all");
          }}
          className={`shrink-0 rounded-full px-3 py-1 font-medium transition ${
            selectedTag === "all" && selectedStatus === "all"
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Reports ({points.length})
        </button>
        {COMMON_TAGS.map((t) => {
          const isActive = selectedTag.toLowerCase() === t.id.toLowerCase();
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTag(isActive ? "all" : t.id)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition border ${
                isActive
                  ? "bg-river-600 text-white border-river-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="relative isolate h-[56dvh] min-h-[340px] max-h-[640px] overflow-hidden rounded-2xl border border-slate-200 md:h-[540px]">
        <MapContainer
          center={PUNE_CENTER}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <ScrollZoomOnClick />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredPoints.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={selectedPoint?.id === p.id ? 14 : 11}
              eventHandlers={{
                click: () => {
                  setSelectedPoint(p);
                },
              }}
              pathOptions={{
                color: selectedPoint?.id === p.id ? "#0f172a" : "#ffffff",
                weight: selectedPoint?.id === p.id ? 3 : 2,
                fillColor: COLOR[p.status] ?? "#dc2626",
                fillOpacity: 0.9,
              }}
            />
          ))}
        </MapContainer>

        {/* Slide-Up Bottom Sheet / Preview Drawer for Clicked Hotspot */}
        {selectedPoint && (
          <div className="absolute inset-x-0 bottom-0 z-[1000] p-2.5 sm:p-4">
            <div className="relative mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-slidein">
              <button
                onClick={() => setSelectedPoint(null)}
                aria-label="Close preview"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <CloseIcon width={14} height={14} />
              </button>

              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {selectedPoint.location_description}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(selectedPoint.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {selectedPoint.reporter_name && ` · Reported by ${selectedPoint.reporter_name}`}
                  </p>
                </div>
                <StatusBadge status={selectedPoint.status} />
              </div>

              {/* Tags */}
              {Array.isArray(selectedPoint.tags) && selectedPoint.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedPoint.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${getTagStyle(
                        tag
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {selectedPoint.description}
              </p>

              {/* Thumbnail Previews (Initial & Cleanup Proof) */}
              <div className="mt-2.5 flex items-center gap-2">
                {selectedPoint.photo_url && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPoint.photo_url}
                      alt="Initial report site"
                      className="h-14 w-20 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-medium text-white">
                      Before
                    </span>
                  </div>
                )}
                {selectedPoint.proof_photo_url && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPoint.proof_photo_url}
                      alt="Cleaned up proof"
                      className="h-14 w-20 rounded-lg object-cover border border-green-300"
                    />
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-green-700/80 px-1 text-[9px] font-medium text-white">
                      Cleaned ✓
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/report/${selectedPoint.id}`}
                  className="btn-primary flex-1 !min-h-[38px] !py-2 text-xs font-semibold"
                >
                  View Full Report & Actions →
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  className="btn-secondary !min-h-[38px] !py-2 !px-3 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>Showing {filteredPoints.length} of {points.length} hotspots</span>
        <span>Tap any marker to inspect & claim</span>
      </div>
    </div>
  );
}
