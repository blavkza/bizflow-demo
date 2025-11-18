"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Department, Employee } from "../types";
import { useState } from "react";

interface DepartmentsTabProps {
  departments?: Department[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function DepartmentsTab({
  departments = [],
  loading = false,
  onRefresh,
}: DepartmentsTabProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDepartmentDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDialogOpen(true);
  };

  const getPerformanceStatus = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Needs Improvement";
    return "Poor";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-blue-100 text-blue-800";
      case "Needs Improvement":
        return "bg-yellow-100 text-yellow-800";
      case "Poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getMetricColor = (value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 80) return "text-blue-600";
    if (value >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getHighPerformers = (dept: Department): number => {
    if (!dept.employees || !Array.isArray(dept.employees)) return 0;
    return dept.employees.filter((emp: Employee) => emp.currentPoints >= 80)
      .length;
  };

  const getNeedSupport = (dept: Department): number => {
    if (!dept.employees || !Array.isArray(dept.employees)) return 0;
    return dept.employees.filter((emp: Employee) => emp.currentPoints < 70)
      .length;
  };

  const getEmployeeCount = (dept: Department): number => {
    if (!dept.employees || !Array.isArray(dept.employees)) return 0;
    return dept.employees.length;
  };

  const getPerformanceDistribution = (dept: Department) => {
    if (!dept.employees || !Array.isArray(dept.employees)) {
      return { excellent: 0, good: 0, needsImprovement: 0, poor: 0 };
    }

    return {
      excellent: dept.employees.filter(
        (emp: Employee) => emp.currentPoints >= 90
      ).length,
      good: dept.employees.filter(
        (emp: Employee) => emp.currentPoints >= 80 && emp.currentPoints < 90
      ).length,
      needsImprovement: dept.employees.filter(
        (emp: Employee) => emp.currentPoints >= 70 && emp.currentPoints < 80
      ).length,
      poor: dept.employees.filter((emp: Employee) => emp.currentPoints < 70)
        .length,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Department Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Performance overview by department
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="h-12 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Department Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Performance overview by department
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const highPerformers = getHighPerformers(dept);
          const needSupport = getNeedSupport(dept);
          const employeeCount = getEmployeeCount(dept);
          const hasEmployees = employeeCount > 0;

          return (
            <Card
              key={dept.name}
              className="flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => openDepartmentDialog(dept)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{dept.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{employeeCount}</Badge>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: dept.color || "#8884d8" }}
                    >
                      {dept.avgScore || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average Score
                    </p>
                  </div>

                  <Progress value={dept.avgScore || 0} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {highPerformers}
                      </div>
                      <div className="text-muted-foreground">
                        High Performers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">
                        {needSupport}
                      </div>
                      <div className="text-muted-foreground">Need Support</div>
                    </div>
                  </div>

                  {hasEmployees && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-muted-foreground">
                          Top Performers
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to view all
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {dept
                          .employees!.sort(
                            (a, b) => b.currentPoints - a.currentPoints
                          )
                          .slice(0, 4)
                          .map((employee, index) => (
                            <Avatar
                              key={employee.id}
                              className="border-2 border-background h-8 w-8"
                            >
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback className="text-xs">
                                {employee.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        {employeeCount > 4 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{employeeCount - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          {selectedDepartment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: selectedDepartment.color || "#8884d8",
                    }}
                  ></div>
                  <span>{selectedDepartment.name} Department</span>
                </DialogTitle>
                <DialogDescription>
                  {getEmployeeCount(selectedDepartment)} employees • Average
                  Score: {selectedDepartment.avgScore || 0}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {(() => {
                  const distribution =
                    getPerformanceDistribution(selectedDepartment);
                  return (
                    <>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {distribution.excellent}
                        </div>
                        <div className="text-sm text-green-800">Excellent</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {distribution.good}
                        </div>
                        <div className="text-sm text-blue-800">Good</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {distribution.needsImprovement}
                        </div>
                        <div className="text-sm text-yellow-800">
                          Needs Improvement
                        </div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {distribution.poor}
                        </div>
                        <div className="text-sm text-red-800">Poor</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Employees</h3>
                <div className="grid gap-3">
                  {selectedDepartment.employees &&
                  Array.isArray(selectedDepartment.employees) ? (
                    selectedDepartment.employees
                      .sort(
                        (a: any, b: any) => b.currentPoints - a.currentPoints
                      )
                      .map((employee: Employee) => (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback>
                                {employee.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {employee.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {employee.position}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p
                                  className={`text-sm font-semibold ${getMetricColor(employee.metrics.productivity)}`}
                                >
                                  {employee.metrics.productivity}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Prod
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-semibold ${getMetricColor(employee.metrics.quality)}`}
                                >
                                  {employee.metrics.quality}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Quality
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-semibold ${getMetricColor(employee.metrics.attendance)}`}
                                >
                                  {employee.metrics.attendance}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Attend
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-semibold ${getMetricColor(employee.metrics.teamwork)}`}
                                >
                                  {employee.metrics.teamwork}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Team
                                </p>
                              </div>
                            </div>

                            <div className="text-right min-w-[100px]">
                              <div className="flex items-center justify-end space-x-1 mb-1">
                                <span className="text-lg font-bold">
                                  {employee.currentPoints}
                                </span>
                                {getTrendIcon(employee.trend)}
                              </div>
                              <Badge
                                className={getStatusColor(
                                  getPerformanceStatus(employee.currentPoints)
                                )}
                              >
                                {getPerformanceStatus(employee.currentPoints)}
                              </Badge>
                            </div>

                            {employee.warnings &&
                              employee.warnings.length > 0 && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {employee.warnings.length}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No employees found in this department</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
