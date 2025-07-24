"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import EmployeesPageWrapper from "./_components/EmployeesPageWrapper";
import EmployeesLoading from "./_components/loading";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  workType: string;
  salary: number;
  location: string;
  startDate: string;
  manager: string;
  avatar: string | null;
}

interface Department {
  id: string;
  name: string;
  // Add other department properties as needed
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get("/api/employees");
        setEmployees(response.data.employees);
        setDepartments(response.data.departments);
        setStatuses(response.data.statuses);
        setWorkTypes(response.data.workTypes);
      } catch (err) {
        setError("Failed to fetch employees");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <EmployeesLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <EmployeesPageWrapper
      employees={employees}
      departments={departments}
      initialStatuses={statuses}
      initialWorkTypes={workTypes}
    />
  );
}
