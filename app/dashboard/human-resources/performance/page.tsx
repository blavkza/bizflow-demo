"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PerformanceCards,
  OverviewTab,
  IndividualPerformanceTab,
  DepartmentsTab,
  WarningsTab,
  WarningDialog,
} from "./components";
import { Employee, WarningFormData } from "./types";

export default function EmployeePerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const handleGenerateWarning = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsWarningDialogOpen(true);
  };

  const handleWarningSubmit = async (data: WarningFormData) => {
    try {
      const response = await fetch("/api/performance/warnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate warning");
      }

      // Show success message
      alert(`Warning generated successfully for ${selectedEmployee?.name}!`);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Failed to generate warning:", error);
      alert("Failed to generate warning. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Employee Performance
          </h2>
          <p className="text-muted-foreground">
            Track performance metrics, goals, and generate warnings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <PerformanceCards />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          <TabsTrigger value="warnings">Warnings & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="individual">
          <IndividualPerformanceTab onGenerateWarning={handleGenerateWarning} />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="warnings">
          <WarningsTab />
        </TabsContent>
      </Tabs>

      {selectedEmployee && (
        <WarningDialog
          open={isWarningDialogOpen}
          onOpenChange={setIsWarningDialogOpen}
          onGenerateWarning={handleWarningSubmit}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
        />
      )}
    </div>
  );
}
