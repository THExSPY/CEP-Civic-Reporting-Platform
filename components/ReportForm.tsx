"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// Converts a Capacitor Camera dataUrl/webPath result into a File so it
// can go through the same Supabase upload path as a browser file input.
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

export default function ReportForm({
  user,
  defaultName = "",
}: {
  user: User | null;
  defaultName?: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [reporterName, setReporterName] = useState(defaultName);
  // Decided after mount so server and client markup match (avoids a hydration warning).
  const [isNative, setIsNative] = useState(false);
  useEffect(() => setIsNative(Capacitor.isNativePlatform()), []);
  const [locationDesc, setLocationDesc] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mirrors streamlit_geolocation() from the original app — asks for the
  // device's current position. Uses the native Geolocation plugin when
  // running as the packaged Android app (proper permission prompt, more
  // reliable than WebView geo), falls back to the browser API on the web.
  async function captureLocation() {
    setLocating(true);
    setError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else {
        if (!navigator.geolocation) {
          setError("Geolocation isn't supported on this browser.");
          return;
        }
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              resolve();
            },
            reject,
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
    } catch {
      setError("Couldn't get your location — you can still submit with the text description.");
    } finally {
      setLocating(false);
    }
  }

  // Native camera capture (packaged app) vs. plain file input (web).
  async function takePhoto() {
    setError(null);
    try {
      const photoResult = await Camera.getPhoto({
        quality: 70,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // lets the user choose camera or gallery
      });
      if (photoResult.dataUrl) {
        setPhoto(await dataUrlToFile(photoResult.dataUrl, `report-${Date.now()}.jpg`));
      }
    } catch {
      // User cancelled the camera/gallery picker — not an error worth surfacing.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description || !locationDesc) {
      setError("Please provide at least a location and a description.");
      return;
    }

    setSubmitting(true);

    let photoUrl: string | null = null;

    if (photo) {
      const fileExt = photo.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(filePath, photo);

      if (uploadError) {
        setError(`Photo upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("report-photos")
        .getPublicUrl(filePath);
      photoUrl = publicUrlData.publicUrl;
    }

    // Default to central Pune if the browser location was denied —
    // the text description still lets responders find the spot.
    const lat = coords?.lat ?? 18.5204;
    const lng = coords?.lng ?? 73.8567;

    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: user?.id ?? null,
      reporter_name: reporterName || null,
      location_description: locationDesc,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      description,
      photo_url: photoUrl,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/#map");
      router.refresh();
    }, 1200);
  }

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 p-5 text-center text-green-800">
        <p className="text-lg font-semibold">Thank you! 🌱</p>
        <p className="text-sm">Your report has been logged. Taking you to the map…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">
          Your Name (Optional)
        </label>
        <input
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="label">
          Location Description
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            required
            value={locationDesc}
            onChange={(e) => setLocationDesc(e.target.value)}
            placeholder="e.g. Near Deccan Gymkhana bridge"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={captureLocation}
            className="btn-secondary shrink-0"
            title="Use my current location"
          >
            {locating ? "Locating…" : "📍 Use my location"}
          </button>
        </div>
        {coords && (
          <p className="mt-1.5 text-xs text-green-700">
            ✓ Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div>
        <label className="label">
          Describe the pollution or hazard
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input"
        />
      </div>

      <div>
        <label className="label">
          Upload a photo of the dumping site
        </label>
        {isNative ? (
          <button
            type="button"
            onClick={takePhoto}
            className="btn-secondary w-full"
          >
            {photo ? `✓ ${photo.name}` : "📷 Take or choose a photo"}
          </button>
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-river-500 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full !py-3 text-base"
      >
        {submitting ? "Submitting…" : "Submit Report"}
      </button>

      {!user && (
        <p className="text-center text-xs text-slate-500">
          Reporting anonymously. Log in to track your reports and get status updates.
        </p>
      )}
    </form>
  );
}
