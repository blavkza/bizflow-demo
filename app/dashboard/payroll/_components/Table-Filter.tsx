// app/workers/_components/Table-Filter.tsx
"use client";

import { useState } from "react";
import { EmployeeWithDetails } from "@/types/payroll";
import ActionBar from "./ActionBar";
import WorkersList from "./Workers-List";

interface TableFilterProps {
  initialEmployees: EmployeeWithDetails[];
}

export default function TableFilter({ initialEmployees }: TableFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredEmployees = initialEmployees.filter((employee) => {
    // Search filter
    const matchesSearch =
      `${employee.firstName} ${employee.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    // Department filter
    const matchesDepartment =
      departmentFilter === "all" ||
      employee.department?.name === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  return (
    <>
      <ActionBar
        employees={initialEmployees}
        onSearch={setSearchTerm}
        onDepartmentFilter={setDepartmentFilter}
      />
      <WorkersList employees={filteredEmployees} />
    </>
  );
}
