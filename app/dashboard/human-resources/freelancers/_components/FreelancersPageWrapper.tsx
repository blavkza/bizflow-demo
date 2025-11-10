"use client";

import { useState } from "react";
import Header from "./Header";
import StatsCard from "./Stats-Card";
import Filters from "./Filters";
import FreelancersList from "./freelancers-List";

interface FreelancersPageWrapperProps {
  freelancers: any[];
  departments: any[];
  initialStatuses: string[];
  fetchFreelancers: () => void;
  hasFullAccess: boolean;
  canCreateFreelancers: boolean;
  canViewFreelancers: boolean;
}

export default function FreelancersPageWrapper({
  freelancers: initialFreelancers = [], // Provide default empty array
  departments = [], // Provide default empty array
  initialStatuses = [], // Provide default empty array
  fetchFreelancers,
  hasFullAccess,
  canCreateFreelancers,
  canViewFreelancers,
}: FreelancersPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Safe filtering with null checks
  const filteredFreelancers = (initialFreelancers || []).filter(
    (freelancer) => {
      // Check if freelancer exists and has required properties
      if (!freelancer) return false;

      const fullName =
        `${freelancer.firstName || ""} ${freelancer.lastName || ""}`.toLowerCase();
      const email = freelancer.email?.toLowerCase() || "";
      const position = freelancer.position?.toLowerCase() || "";

      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        position.includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "All Departments" ||
        freelancer.department === selectedDepartment;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        freelancer.status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    }
  );

  return (
    <div className="space-y-6 p-6">
      <Header
        fetchFreelancers={fetchFreelancers}
        canCreateFreelancers={canCreateFreelancers}
        hasFullAccess={hasFullAccess}
      />
      <StatsCard freelancers={filteredFreelancers} departments={departments} />
      <Filters
        departments={(departments || []).map((dept) => dept?.name || "")}
        statuses={initialStatuses || []}
        onSearchChange={setSearchTerm}
        onDepartmentChange={setSelectedDepartment}
        onStatusChange={setSelectedStatus}
      />
      <FreelancersList
        freelancers={filteredFreelancers}
        canViewFreelancers={canViewFreelancers}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
