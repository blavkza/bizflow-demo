"use client";

import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { WorkerWithDetails } from "@/types/payroll";
import PayrollForm from "./Payroll-Form";
import { useRouter } from "next/navigation";

interface ActionBarProps {
  onSearch: (searchTerm: string) => void;
  onDepartmentFilter: (department: string) => void;
  onWorkerTypeFilter: (workerType: "all" | "employees" | "freelancers") => void;
  employees: WorkerWithDetails[];
  fetchEmployees: () => void;
  hasFullAccess: boolean;
  canManagePayroll: boolean;
}

export default function ActionBar({
  onSearch,
  onDepartmentFilter,
  onWorkerTypeFilter,
  employees,
  fetchEmployees,
  hasFullAccess,
  canManagePayroll,
}: ActionBarProps) {
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const router = useRouter();

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE"
  );

  // Calculate counts
  const employeesCount = employees.filter((emp) => !emp.isFreelancer).length;
  const freelancersCount = employees.filter((emp) => emp.isFreelancer).length;
  const activeEmployeesCount = activeEmployees.filter(
    (emp) => !emp.isFreelancer
  ).length;
  const activeFreelancersCount = activeEmployees.filter(
    (emp) => emp.isFreelancer
  ).length;

  const departmentNames = Array.from(
    new Set(
      employees
        .map((e) => e.department?.name)
        .filter((name): name is string => !!name)
    )
  );

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search workers..."
            className="max-w-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
          <Select onValueChange={(value) => onDepartmentFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentNames.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value: "all" | "employees" | "freelancers") =>
              onWorkerTypeFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Worker type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Workers ({employees.length})
              </SelectItem>
              <SelectItem value="employees">
                Employees ({employeesCount})
              </SelectItem>
              <SelectItem value="freelancers">
                Freelancers ({freelancersCount})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(canManagePayroll || hasFullAccess) && (
          <div className="flex gap-2">
            <Dialog
              open={isPayrollDialogOpen}
              onOpenChange={setIsPayrollDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Process Payroll</DialogTitle>
                  <DialogDescription>
                    Process monthly payroll for all{" "}
                    <span className="text-green-600 font-bold">
                      ACTIVE ({activeEmployees.length})
                    </span>{" "}
                    workers only.
                    <div className="mt-2 text-sm">
                      <span className="text-blue-600">
                        {activeEmployeesCount} employees
                      </span>
                      {" + "}
                      <span className="text-orange-600">
                        {activeFreelancersCount} freelancers
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <PayrollForm
                  employees={activeEmployees}
                  onCancel={() => setIsPayrollDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsPayrollDialogOpen(false);
                    if (fetchEmployees) fetchEmployees();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
