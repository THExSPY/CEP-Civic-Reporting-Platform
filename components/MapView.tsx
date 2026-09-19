"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { createClient } from "@/lib/supabase/client";
import type { ReportPoint } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  open: "#dc2626", // red — needs attention
  claimed: "#d97706", // amber — someone's on it
  collected: "#2563eb", // blue — picked up, pending resolution
  resolved: "#16a34a", // green — done
};

// Centered on Pune so the pilot river-vicinity reports and citywide
// reports both show up naturally as the platform grows.
const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

export default function MapView() {
  const [points, setPoints] = useState<ReportPoint[]>([]);
  const supabase = createClient();

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

  return (
    <MapContainer
      center={PUNE_CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{
            color: STATUS_COLOR[p.status] ?? "#dc2626",
            fillColor: STATUS_COLOR[p.status] ?? "#dc2626",
            fillOpacity: 0.6,
          }}
        >
          <Popup>
            <strong>{p.location_description}</strong>
            <br />
            {p.description}
            {p.photo_url && (
              <>
                <br />
                <img src={p.photo_url} alt="report" style={{ maxWidth: 180, marginTop: 4 }} />
              </>
            )}
            <br />
            <span style={{ textTransform: "capitalize" }}>{p.status}</span>
            <br />
            <a href={`/report/${p.id}`} style={{ color: "#0e7490" }}>
              View details →
            </a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
