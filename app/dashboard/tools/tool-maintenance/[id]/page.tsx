import { MaintenanceDetailClient } from "./_components/maintenance-detail-client";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return <MaintenanceDetailClient maintenanceId={id} />;
}
