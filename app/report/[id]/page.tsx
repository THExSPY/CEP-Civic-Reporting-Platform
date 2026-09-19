import { createClient } from "@/lib/supabase/server";
import ReportDetail from "@/components/ReportDetail";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <div className="mx-auto max-w-lg">
      <ReportDetail reportId={params.id} profile={profile} />
    </div>
  );
}
