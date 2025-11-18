"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Employee, WarningFormData, UnifiedPerformanceData } from "./types";
import { toast } from "sonner";

// Define the unified data structure
interface UnifiedPerformanceResponse {
  overview: {
    averageScore: number;
    topPerformers: number;
    needsAttention: number;
    activeWarnings: number;
    trend: number;
    totalEmployees: number;
    departmentStats: any[];
    calculatedAt: string;
  };
  employees: Employee[];
  departments: any[];
  warnings: any[];
  trends: any[];
  distribution: any[];
}

// Fetch function for React Query
const fetchPerformanceData = async (
  period: string
): Promise<UnifiedPerformanceResponse> => {
  const response = await fetch(`/api/performance/unified?period=${period}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch performance data: ${response.status}`);
  }
  return response.json();
};

export default function EmployeePerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  // React Query for performance data
  const {
    data: performanceData,
    isLoading: loading,
    error,
    refetch: refetchPerformanceData,
  } = useQuery<UnifiedPerformanceResponse>({
    queryKey: ["performance", selectedPeriod],
    queryFn: () => fetchPerformanceData(selectedPeriod),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  const handleGenerateWarning = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsWarningDialogOpen(true);
  };

  const handleResolveWarning = async (warning: any, employee: Employee) => {
    try {
      const response = await fetch(`/api/performance/warnings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warningId: warning.id,
          status: "RESOLVED",
          resolutionNotes: `Warning resolved for ${employee.name}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve warning");
      }

      // Invalidate and refetch the performance data
      refetchPerformanceData();

      toast.success(`Warning resolved for ${employee.name}`);
    } catch (error) {
      console.error("Failed to resolve warning:", error);
      toast.error("Failed to resolve warning. Please try again.");
    }
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

      toast.success(
        `Warning generated successfully for ${selectedEmployee?.name}!`
      );

      // Invalidate and refetch the performance data
      refetchPerformanceData();

      setIsWarningDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to generate warning:", error);
      toast.error("Failed to generate warning. Please try again.");
    }
  };

  const handleRefreshData = () => {
    refetchPerformanceData();
  };

  // Handle error state
  if (error) {
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
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <h3 className="text-lg font-semibold mb-2">Failed to load data</h3>
            <p>{error.message}</p>
          </div>
          <button
            onClick={() => refetchPerformanceData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Employee Performance
          </h2>
          <p className="text-muted-foreground">
            Track performance metrics, goals, and generate warnings
            {performanceData && (
              <span>
                {" "}
                • Last updated:{" "}
                {new Date(
                  performanceData.overview.calculatedAt
                ).toLocaleTimeString()}
              </span>
            )}
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

      {/* Pass data to PerformanceCards */}
      <PerformanceCards
        overview={performanceData?.overview}
        loading={loading}
        onRefresh={handleRefreshData}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          <TabsTrigger value="warnings">Warnings & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            trends={performanceData?.trends || []}
            distribution={performanceData?.distribution || []}
            departmentStats={performanceData?.overview?.departmentStats || []}
            loading={loading}
            onRefresh={handleRefreshData}
          />
        </TabsContent>

        <TabsContent value="individual">
          <IndividualPerformanceTab
            employees={performanceData?.employees || []}
            loading={loading}
            onGenerateWarning={handleGenerateWarning}
            onRefresh={handleRefreshData}
          />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab
            departments={performanceData?.departments || []}
            loading={loading}
            onRefresh={handleRefreshData}
          />
        </TabsContent>

        <TabsContent value="warnings">
          <WarningsTab
            warnings={performanceData?.warnings || []}
            loading={loading}
            onResolveWarning={handleResolveWarning}
            onRefresh={handleRefreshData}
          />
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
