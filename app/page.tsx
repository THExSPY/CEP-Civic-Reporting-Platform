import Link from "next/link";
import HomeMap from "@/components/HomeMap";
import { MapPinIcon, PlusIcon } from "@/components/icons";
import { getSessionContext } from "@/lib/auth";
import { getFirstName } from "@/lib/names";

const STEPS = [
  { n: 1, title: "Report", text: "Snap a photo, drop a pin and describe what you found." },
  { n: 2, title: "Claim", text: "Volunteers and recycling partners claim nearby reports." },
  { n: 3, title: "Resolve", text: "Waste gets collected and the hotspot turns green." },
];

export default async function HomePage() {
  const { user, profile } = await getSessionContext();
  const firstName = getFirstName(user, profile);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-river-700 via-river-500 to-teal-500 px-5 py-8 text-white shadow-lg shadow-river-500/20 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <MapPinIcon width={14} height={14} />
            Pune · starting with the Mula-Mutha river
          </span>
          {firstName && (
            <p className="mt-4 text-lg font-medium text-river-100">Hi, {firstName} 👋</p>
          )}
          <h1 className={`${firstName ? "mt-1" : "mt-4"} text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl`}>
            Spot it. Report it.
            <br />
            Clean it up.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-river-50 sm:text-base">
            Report plastic dumping and environmental hazards anywhere in Pune and
            connect directly with volunteers and recycling partners who can act on it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/report"
              className="btn bg-white !text-river-700 shadow-md hover:bg-river-50 font-bold"
            >
              <PlusIcon width={18} height={18} />
              Report an Issue
            </Link>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="btn border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              {user ? "Go to Dashboard" : "Log in"}
            </Link>
            <Link
              href="/download"
              className="btn border border-white/40 bg-black/20 text-white backdrop-blur hover:bg-black/30"
            >
              📥 Download Android APK
            </Link>
          </div>
        </div>
      </section>

      {/* Hotspot map */}
      <section id="map" className="card scroll-mt-20 !p-4 sm:!p-5">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">Live hotspot map</h2>
          <p className="text-sm text-slate-500">
            Every reported issue across Pune, colour-coded by status.
          </p>
        </div>
        <HomeMap />
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-3 px-1 text-lg font-bold text-slate-900">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card flex items-start gap-3 !p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-river-50 text-sm font-bold text-river-600">
                {s.n}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="text-sm text-slate-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
