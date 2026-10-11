import ReportForm from "@/components/ReportForm";
import { getSessionContext } from "@/lib/auth";
import { getFirstName } from "@/lib/names";

export default async function ReportPage() {
  const { user, profile } = await getSessionContext();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Report an Issue</h1>
      <p className="mb-5 text-slate-600">
        Help us monitor and clean up Pune by reporting plastic dumping and
        environmental hazards — anywhere in the city.
      </p>
      <div className="card">
        <ReportForm user={user} defaultName={getFirstName(user, profile)} />
      </div>
    </div>
  );
}
