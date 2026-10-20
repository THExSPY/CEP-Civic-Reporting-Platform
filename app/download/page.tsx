import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export const metadata = {
  title: "Download Android APK | Pune Civic Reporting Platform",
  description: "Download the official Android APK for Pune Civic Reporting to report waste hotspots with native GPS and camera integration.",
};

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-2">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-river-600 hover:underline"
      >
        <ArrowLeftIcon width={16} height={16} />
        Back to Home
      </Link>

      <div className="card overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-river-600 via-river-500 to-teal-500 p-6 text-white sm:p-8">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            Android Application (APK)
          </span>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">
            Pune Civic Reporting App
          </h1>
          <p className="mt-2 text-sm text-river-100 sm:text-base">
            Equipped with native GPS location capture and camera support for reliable field reporting along the Mula-Mutha river and throughout Pune.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/downloads/TheCivic.apk"
              download="TheCivic.apk"
              className="btn bg-white !text-river-700 shadow-lg hover:bg-river-50 !py-3.5 !px-6 text-base font-bold"
            >
              📥 Download APK (6.5 MB)
            </a>
            <span className="text-xs text-river-100">
              Version 1.0 · Android 7.0+
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Why use the Android App?
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xl">📍</p>
                <p className="mt-1 font-semibold text-slate-800 text-sm">Accurate GPS</p>
                <p className="mt-0.5 text-xs text-slate-500">Native device geolocation without browser permission hiccups.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xl">📸</p>
                <p className="mt-1 font-semibold text-slate-800 text-sm">Direct Camera</p>
                <p className="mt-0.5 text-xs text-slate-500">Quickly snap dumping evidence in the field.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-xl">⚡</p>
                <p className="mt-1 font-semibold text-slate-800 text-sm">Live Hotspots</p>
                <p className="mt-0.5 text-xs text-slate-500">Real-time status updates as waste is collected.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              How to Install the APK
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-50 font-bold text-river-600 text-xs">
                  1
                </span>
                <span>
                  Tap <strong>Download APK</strong> above. Your Android browser may prompt you that the file could be harmful—select <strong>Download anyway</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-50 font-bold text-river-600 text-xs">
                  2
                </span>
                <span>
                  Once downloaded, tap the notification or open your device’s <strong>Downloads</strong> folder and tap <strong>TheCivic.apk</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-50 font-bold text-river-600 text-xs">
                  3
                </span>
                <span>
                  If prompted, allow your browser or file manager permission to <strong>Install unknown apps</strong> in Settings.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-50 font-bold text-river-600 text-xs">
                  4
                </span>
                <span>
                  Tap <strong>Install</strong>, then open the app and grant Location and Camera permissions when prompted.
                </span>
              </li>
            </ol>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            <strong>iOS or Desktop user?</strong> No installation is required! You can use all features directly in your browser with zero downloads.
          </div>
        </div>
      </div>
    </div>
  );
}
