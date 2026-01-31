"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PayrollForm from "../../_components/Payroll-Form";
import Loading from "../../_components/loading";
import { WorkerWithDetails } from "@/types/payroll";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditPayrollDraftPage() {
  const params = useParams();
  const router = useRouter();
  const [payroll, setPayroll] = useState<any>(null);
  const [workers, setWorkers] = useState<WorkerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payrollId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payrollRes, workersRes] = await Promise.all([
          fetch(`/api/payroll/${payrollId}`),
          fetch("/api/payroll")
        ]);

        if (!payrollRes.ok) throw new Error("Failed to fetch payroll draft");
        if (!workersRes.ok) throw new Error("Failed to fetch workers");

        const payrollData = await payrollRes.json();
        const workersData = await workersRes.json();

        if (payrollData.status !== "DRAFT") {
          throw new Error("Only draft payrolls can be edited");
        }

        setPayroll(payrollData);
        setWorkers(workersData);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [payrollId]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="p-6">
      <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 mb-4">
        {error}
      </div>
      <Button onClick={() => router.back()} variant="outline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Payroll Draft</h1>
          <p className="text-muted-foreground">
            Adjust payments for {payroll.month} before final processing.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <PayrollForm
          employees={workers.filter(w => w.status === "ACTIVE")}
          initialPayroll={payroll}
          onCancel={() => router.back()}
          onSubmitSuccess={() => {
            router.push("/dashboard/payroll");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
