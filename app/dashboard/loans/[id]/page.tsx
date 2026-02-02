import { LoanDetailClient } from "./_components/loan-detail-client";

export default async function LoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LoanDetailClient loanId={id} />
      </div>
    </div>
  );
}
