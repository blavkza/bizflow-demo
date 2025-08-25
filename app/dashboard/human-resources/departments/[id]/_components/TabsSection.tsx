"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Users, DollarSign, Settings } from "lucide-react";
import { Department } from "@/types/department";
import OverviewSection from "./OverviewSection";
import EmployeesSection from "./EmployeesSection";
import BudgetSection from "./BudgetSection";

interface TabsSectionProps {
  department: Department;
  canCreateEmployees: boolean;
  canViewEmployees: boolean;
  hasFullAccess: boolean;
  fetchDepartment: () => void;
  departmentId: string;
}

export default function TabsSection({
  department,
  canCreateEmployees,
  canViewEmployees,
  hasFullAccess,
  fetchDepartment,
  departmentId,
}: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            Employees
          </TabsTrigger>
          {/* <TabsTrigger value="budget" className="flex items-center gap-2">
            Budget
          </TabsTrigger> */}
        </TabsList>
        <OverviewSection department={department} />
        <EmployeesSection
          department={department}
          canCreateEmployees={canCreateEmployees}
          canViewEmployees={canViewEmployees}
          hasFullAccess={hasFullAccess}
          fetchDepartment={fetchDepartment}
          departmentId={departmentId}
        />
        {/*         <BudgetSection department={department} />
         */}{" "}
      </Tabs>
    </div>
  );
}
