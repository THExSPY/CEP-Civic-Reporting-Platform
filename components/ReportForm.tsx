"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { COMMON_TAGS } from "@/lib/tags";
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
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

  async function handlePhotoFile(file: File | null) {
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, file.name);
      setPhoto(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (e) {
      console.warn("Compression failed, using original:", e);
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  // Native camera capture (packaged app) vs. plain file input (web).
  async function takePhoto() {
    setError(null);
    try {
      const photoResult = await Camera.getPhoto({
        quality: 75,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // lets the user choose camera or gallery
      });
      if (photoResult.dataUrl) {
        setCompressing(true);
        const rawFile = await dataUrlToFile(photoResult.dataUrl, `report-${Date.now()}.jpg`);
        const compressed = await compressImage(rawFile, rawFile.name);
        setPhoto(compressed);
        setPhotoPreview(photoResult.dataUrl);
        setCompressing(false);
      }
    } catch {
      setCompressing(false);
      // User cancelled the camera/gallery picker — not an error worth surfacing.
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  function addCustomTag(e: React.KeyboardEvent | React.MouseEvent) {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTag("");
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
      const fileExt = photo.name.split(".").pop() || "jpg";
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(filePath, photo, { contentType: "image/jpeg" });

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
      tags: selectedTags,
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
          Category Tags (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map((t) => {
            const isSelected = selectedTags.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                  isSelected
                    ? "bg-river-600 text-white border-river-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isSelected ? "✓ " : "+ "}
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={addCustomTag}
            placeholder="Add custom tag (press Enter)"
            className="input !py-1.5 !text-xs flex-1"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="btn-secondary !py-1.5 !px-3 text-xs shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="label">
          Describe the pollution or hazard
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What kind of waste is it? Is it in the riverbed, blocking a nala, or on the road?"
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
            {photo ? `✓ Photo attached` : "📷 Take or choose a photo"}
          </button>
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-river-500 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        )}

        {compressing && (
          <p className="mt-2 text-xs text-river-600 animate-pulse">
            ⚡ Optimizing and compressing image...
          </p>
        )}

        {photoPreview && !compressing && (
          <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Preview"
              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
            />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Photo attached & compressed</p>
              {photo && (
                <p className="text-slate-500">
                  Ready to upload · {Math.round(photo.size / 1024)} KB
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPhotoPreview(null);
              }}
              className="ml-auto text-xs font-semibold text-red-600 hover:underline px-2"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting || compressing}
        className="btn-primary w-full !py-3 text-base"
      >
        {submitting ? "Submitting…" : compressing ? "Compressing photo…" : "Submit Report"}
      </button>

      {!user && (
        <p className="text-center text-xs text-slate-500">
          Reporting anonymously. Log in to track your reports and get status updates.
        </p>
      )}
    </form>
  );
}
