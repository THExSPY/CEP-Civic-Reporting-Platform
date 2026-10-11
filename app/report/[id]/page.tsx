import ReportDetail from "@/components/ReportDetail";
import { getSessionContext } from "@/lib/auth";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { profile } = await getSessionContext();

  return (
    <div className="mx-auto max-w-lg">
      <ReportDetail reportId={params.id} profile={profile} />
    </div>
  );
}
