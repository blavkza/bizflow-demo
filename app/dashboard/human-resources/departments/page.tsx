"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import DepartmentList from "./_components/department-list";
import Header from "./_components/header";
import { DepartmentWithRelations } from "./_components/department-list";
import DepartmentsLoading from "../../categories/_components/loading";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/departments/all-departments");
      setDepartments(response.data);
    } catch (err) {
      setError("Failed to fetch departments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <DepartmentsLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header fetchDepartments={fetchDepartments} />
      <DepartmentList departments={departments} />
    </div>
  );
}
