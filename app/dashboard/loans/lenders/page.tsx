import { LenderClient } from "./_components/lender-client";

export default function LendersPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <LenderClient />
      </div>
    </div>
  );
}
