import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="mb-3 text-3xl font-bold">
        Pollution &amp; Waste Reporting Portal
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-slate-600">
        Report plastic dumping and environmental hazards anywhere in Pune,
        starting with the Mula-Mutha river vicinity, and connect directly
        with volunteers and recycling partners who can act on it.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/report"
          className="rounded-md bg-river-500 px-5 py-2.5 font-medium text-white"
        >
          Report an Issue
        </Link>
        <Link
          href="/map"
          className="rounded-md border px-5 py-2.5 font-medium"
        >
          View Hotspot Map
        </Link>
      </div>
    </div>
  );
}
