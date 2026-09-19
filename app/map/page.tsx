"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it can only render client-side.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Pollution Hotspots Map</h1>
      <p className="mb-4 text-slate-600">
        Live view of reported issues across Pune. Red = open, amber = claimed,
        blue = collected, green = resolved.
      </p>
      <div className="h-[600px] overflow-hidden rounded-xl border">
        <MapView />
      </div>
    </div>
  );
}
