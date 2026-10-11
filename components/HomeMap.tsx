"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it can only render client-side.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[52dvh] min-h-[300px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export default function HomeMap() {
  return <MapView />;
}
