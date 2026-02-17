"use client";

import { useState } from "react";
import Header from "./Header";
import StatsCard from "./Stats-Card";
import Filters from "./Filters";
import TrainersList from "./trainers-List";

interface TrainersPageWrapperProps {
  trainers: any[];
  departments: any[];
  initialStatuses: string[];
  fetchTrainers: () => void;
  hasFullAccess: boolean;
  canCreateTrainers: boolean;
  canViewTrainers: boolean;
}

export default function TrainersPageWrapper({
  trainers: initialTrainers = [],
  departments = [],
  initialStatuses = [],
  fetchTrainers,
  hasFullAccess,
  canCreateTrainers,
  canViewTrainers,
}: TrainersPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const filteredTrainers = (initialTrainers || []).filter((trainer) => {
    if (!trainer) return false;

    const fullName =
      `${trainer.firstName || ""} ${trainer.lastName || ""}`.toLowerCase();
    const email = trainer.email?.toLowerCase() || "";
    const position = trainer.position?.toLowerCase() || "";

    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      position.includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      trainer.department === selectedDepartment;

    const matchesStatus =
      selectedStatus === "All Statuses" || trainer.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <Header
        fetchTrainers={fetchTrainers}
        canCreateTrainers={canCreateTrainers}
        hasFullAccess={hasFullAccess}
      />
      <StatsCard trainers={filteredTrainers} departments={departments} />
      <Filters
        departments={(departments || []).map((dept) => dept?.name || "")}
        statuses={initialStatuses || []}
        onSearchChange={setSearchTerm}
        onDepartmentChange={setSelectedDepartment}
        onStatusChange={setSelectedStatus}
      />
      <TrainersList
        trainers={filteredTrainers}
        canViewTrainers={canViewTrainers}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
