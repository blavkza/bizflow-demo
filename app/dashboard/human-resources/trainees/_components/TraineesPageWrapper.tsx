"use client";

import { useState } from "react";
import Header from "./Header";
import StatsCard from "./Stats-Card";
import Filters from "./Filters";
import TraineesList from "./trainees-List";

interface TraineesPageWrapperProps {
  trainees: any[];
  departments: any[];
  initialStatuses: string[];
  fetchTrainees: () => void;
  hasFullAccess: boolean;
  canCreateTrainees: boolean;
  canViewTrainees: boolean;
}

export default function TraineesPageWrapper({
  trainees: initialTrainees = [],
  departments = [],
  initialStatuses = [],
  fetchTrainees,
  hasFullAccess,
  canCreateTrainees,
  canViewTrainees,
}: TraineesPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const filteredTrainees = (initialTrainees || []).filter((trainee) => {
    if (!trainee) return false;

    const fullName =
      `${trainee.firstName || ""} ${trainee.lastName || ""}`.toLowerCase();
    const email = trainee.email?.toLowerCase() || "";
    const position = trainee.position?.toLowerCase() || "";

    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      position.includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      trainee.department === selectedDepartment;

    const matchesStatus =
      selectedStatus === "All Statuses" || trainee.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <Header
        fetchTrainees={fetchTrainees}
        canCreateTrainees={canCreateTrainees}
        hasFullAccess={hasFullAccess}
      />
      <StatsCard trainees={filteredTrainees} departments={departments} />
      <Filters
        departments={(departments || []).map((dept) => dept?.name || "")}
        statuses={initialStatuses || []}
        onSearchChange={setSearchTerm}
        onDepartmentChange={setSelectedDepartment}
        onStatusChange={setSelectedStatus}
      />
      <TraineesList
        trainees={filteredTrainees}
        canViewTrainees={canViewTrainees}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}

