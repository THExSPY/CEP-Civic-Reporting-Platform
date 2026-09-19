import ReportForm from "@/components/ReportForm";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Report an Issue</h1>
      <p className="mb-6 text-slate-600">
        Help us monitor and clean up Pune by reporting plastic dumping and
        environmental hazards — anywhere in the city.
      </p>
      <ReportForm user={user} />
    </div>
  );
}
