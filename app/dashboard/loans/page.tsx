import { LoanClient } from "./_components/loan-client";

export default function LoansPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LoanClient />
      </div>
    </div>
  );
}
