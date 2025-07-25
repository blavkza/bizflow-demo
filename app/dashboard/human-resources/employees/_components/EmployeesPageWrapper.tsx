"use client";

import { useState } from "react";
import Header from "./Header";
import StatsCard from "./Stats-Card";
import Filters from "./Filters";
import EmployeesList from "./Employees-List";

interface EmployeesPageWrapperProps {
  employees: any[];
  departments: any[];
  initialStatuses: string[];
  initialWorkTypes: string[];
  fetchEmployees: () => void;
}

export default function EmployeesPageWrapper({
  employees: initialEmployees,
  departments,
  initialStatuses,
  initialWorkTypes,
  fetchEmployees,
}: EmployeesPageWrapperProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedWorkType, setSelectedWorkType] = useState("All Types");

  const filteredEmployees = initialEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      employee.department === selectedDepartment;

    const matchesStatus =
      selectedStatus === "All Statuses" || employee.status === selectedStatus;

    const matchesWorkType =
      selectedWorkType === "All Types" ||
      employee.workType === selectedWorkType;

    return (
      matchesSearch && matchesDepartment && matchesStatus && matchesWorkType
    );
  });

  return (
    <div className="space-y-6 p-6">
      <Header fetchEmployees={fetchEmployees} />
      <StatsCard employees={filteredEmployees} departments={departments} />
      <Filters
        departments={departments.map((dept) => dept.name)}
        statuses={initialStatuses}
        workTypes={initialWorkTypes}
        onSearchChange={setSearchTerm}
        onDepartmentChange={setSelectedDepartment}
        onStatusChange={setSelectedStatus}
        onWorkTypeChange={setSelectedWorkType}
      />
      <EmployeesList employees={filteredEmployees} />
    </div>
  );
}
