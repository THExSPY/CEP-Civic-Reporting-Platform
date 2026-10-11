"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { createClient } from "@/lib/supabase/client";
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

// Centered on Pune so the pilot river-vicinity reports and citywide
// reports both show up naturally as the platform grows.
const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

// Scroll-wheel zoom only after the map is clicked, so scrolling the page
// past the map doesn't get hijacked.
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
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("report_points").select("*");
      if (data) setPoints(data as ReportPoint[]);
    }
    load();

    // Live updates — new reports appear on everyone's map without a refresh.
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, claimed: 0, collected: 0, resolved: 0 };
    for (const p of points) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [points]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {STATUS_META.map((s) => (
          <div
            key={s.key}
            className="rounded-xl border border-slate-100 bg-slate-50 px-1 py-2.5 text-center"
          >
            <p className="text-xl font-bold leading-none" style={{ color: s.color }}>
              {counts[s.key] ?? 0}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="isolate mt-3 h-[52dvh] min-h-[300px] max-h-[600px] overflow-hidden rounded-2xl border border-slate-200 md:h-[520px]">
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
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={11}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: COLOR[p.status] ?? "#dc2626",
                fillOpacity: 0.85,
              }}
            >
              <Popup maxWidth={240}>
                <strong className="block">{p.location_description}</strong>
                <span className="mt-0.5 block text-slate-600">{p.description}</span>
                {p.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_url}
                    alt="report"
                    style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginTop: 6 }}
                  />
                )}
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize text-white"
                  style={{ background: COLOR[p.status] ?? "#dc2626" }}
                >
                  {p.status}
                </span>
                <a
                  href={`/report/${p.id}`}
                  className="mt-2 block font-medium"
                  style={{ color: "#0e7490" }}
                >
                  View details →
                </a>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Tap a marker for details · updates live
      </p>
    </div>
  );
}
