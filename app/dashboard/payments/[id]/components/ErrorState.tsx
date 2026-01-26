import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ErrorState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-muted-foreground mb-2">
        Payslip not found
      </h2>
      <p className="text-muted-foreground mb-6">
        The requested payslip could not be found.
      </p>
      <Button asChild>
        <Link href="/dashboard/payroll">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payroll
        </Link>
      </Button>
    </div>
  );
};

export default ErrorState;
