import { AllocationDetailClient } from "./_components/allocation-detail-client";

export default function AllocationDetailPage({
  params,
}: {
  params: { type: string; workerId: string };
}) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AllocationDetailClient type={params.type} workerId={params.workerId} />
    </div>
  );
}
