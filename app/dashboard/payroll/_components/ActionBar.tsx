// app/_components/ActionBar.tsx
"use client";

import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { EmployeeWithDetails } from "@/types/payroll";
import PayrollForm from "./Payroll-Form";
import { useRouter } from "next/navigation";

interface ActionBarProps {
  onSearch: (searchTerm: string) => void;
  onDepartmentFilter: (department: string) => void;
  employees: EmployeeWithDetails[];
}

export default function ActionBar({
  onSearch,
  onDepartmentFilter,
  employees,
}: ActionBarProps) {
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const router = useRouter();

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE"
  );

  const totalPayroll = activeEmployees.reduce(
    (sum, employee) => sum + Number(employee.salary),
    0
  );

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
        </div>
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
            <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Process Payroll</DialogTitle>
                <DialogDescription>
                  Process monthly payroll for all{" "}
                  <span className="text-destructive font-bold">ACTIVE</span>{" "}
                  employees only.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Employees</Label>
                  <div className="col-span-3">
                    {activeEmployees.length} active employees
                  </div>
                </div>
              </div>
              <PayrollForm
                employees={activeEmployees}
                onCancel={() => setIsPayrollDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsPayrollDialogOpen(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
