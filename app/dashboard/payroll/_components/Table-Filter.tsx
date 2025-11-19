"use client";

import { useState } from "react";
import { WorkerWithDetails } from "@/types/payroll";
import ActionBar from "./ActionBar";
import WorkersList from "./Workers-List";

interface TableFilterProps {
  initialEmployees: WorkerWithDetails[];
  fetchEmployees: () => void;
  hasFullAccess: boolean;
  canManagePayroll: boolean;
  canViewEmployee: boolean;
}

export default function TableFilter({
  initialEmployees,
  fetchEmployees,
  hasFullAccess,
  canManagePayroll,
  canViewEmployee,
}: TableFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState<
    "all" | "employees" | "freelancers"
  >("all");

  const filteredEmployees = initialEmployees.filter((employee) => {
    const matchesSearch =
      `${employee.firstName} ${employee.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" ||
      employee.department?.name === departmentFilter;

    const matchesWorkerType =
      workerTypeFilter === "all" ||
      (workerTypeFilter === "employees" && !employee.isFreelancer) ||
      (workerTypeFilter === "freelancers" && employee.isFreelancer);

    return matchesSearch && matchesDepartment && matchesWorkerType;
  });

  return (
    <>
      <ActionBar
        employees={initialEmployees}
        onSearch={setSearchTerm}
        onDepartmentFilter={setDepartmentFilter}
        onWorkerTypeFilter={setWorkerTypeFilter}
        fetchEmployees={fetchEmployees}
        canManagePayroll={canManagePayroll}
        hasFullAccess={hasFullAccess}
      />
      <WorkersList
        employees={filteredEmployees}
        canViewEmployee={canViewEmployee}
        hasFullAccess={hasFullAccess}
      />
    </>
  );
}
