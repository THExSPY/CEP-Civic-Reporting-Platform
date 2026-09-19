"use client";

import { useState } from "react";
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

export default function ReportForm({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();

  const [reporterName, setReporterName] = useState("");
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
    setTimeout(() => router.push("/map"), 1200);
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-green-800">
        Thank you! Your report has been logged successfully. Redirecting to the map…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Your Name (Optional)
        </label>
        <input
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Location Description
        </label>
        <div className="flex gap-2">
          <input
            required
            value={locationDesc}
            onChange={(e) => setLocationDesc(e.target.value)}
            placeholder="e.g. Near Deccan Gymkhana bridge"
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button
            type="button"
            onClick={captureLocation}
            className="rounded-md border px-3 py-2 text-sm"
            title="Use my current location"
          >
            {locating ? "…" : "📍 Use GPS"}
          </button>
        </div>
        {coords && (
          <p className="mt-1 text-xs text-slate-500">
            Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Describe the pollution or hazard
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Upload a photo of the dumping site
        </label>
        {Capacitor.isNativePlatform() ? (
          <button
            type="button"
            onClick={takePhoto}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {photo ? `✓ ${photo.name}` : "📷 Take or choose a photo"}
          </button>
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-river-500 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Report"}
      </button>

      {!user && (
        <p className="text-xs text-slate-500">
          Reporting anonymously. Log in to track your reports and get status updates.
        </p>
      )}
    </form>
  );
}
