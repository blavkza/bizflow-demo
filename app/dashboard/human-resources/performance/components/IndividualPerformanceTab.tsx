"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { Employee } from "../types";

interface IndividualPerformanceTabProps {
  employees?: Employee[];
  loading?: boolean;
  onGenerateWarning: (employee: Employee) => void;
  onRefresh?: () => void;
  canCreatePerfomance: boolean;
  hasFullAccess: boolean;
}

export default function IndividualPerformanceTab({
  employees = [],
  loading = false,
  onGenerateWarning,
  onRefresh,
  canCreatePerfomance,
  hasFullAccess,
}: IndividualPerformanceTabProps) {
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

  const getMetricExplanation = (
    metric: string,
    value: number,
    employee: Employee
  ) => {
    const explanations: { [key: string]: string } = {
      productivity: `Productivity measures task efficiency:
      
• Based on estimated vs actual hours for COMPLETED tasks only
• Tasks with time entries: (estimated / actual) × 100
• Tasks without time entries: 90% (penalty for no tracking)
• Capped between 70%-120% for realistic values
• Minimum 70% for tracked work, maximum 120%

Current: ${value}%`,

      quality: `Task Completion Rate:
      
• Formula: (Completed Tasks / Total Assignable Tasks) × 100
• Excludes CANCELLED tasks from total
• Only COMPLETED tasks count toward success

Current: ${value}%`,

      attendance: `Attendance Rate (Weighted Scoring):
      
• PRESENT: 100% credit
• HALF_DAY: 80% credit  
• LATE: 70% credit
• SICK_LEAVE: 50% credit
• ANNUAL_LEAVE: 50% credit
• UNPAID_LEAVE: 30% credit
• ABSENT: 0% credit

Weighted average: ${value}%`,

      teamwork: `Teamwork Score:
      
• Collaborative tasks (with subtasks): 50% of score
• Review tasks (REVIEW status): 30% of score  
• Project diversity: 20% of score
• Minimum score: 20%, Maximum: 100%

Current: ${value}%`,
    };

    return explanations[metric] || "Calculation details not available.";
  };

  const getPerformanceScoreExplanation = (employee: Employee) => {
    const { quality, productivity, attendance, teamwork } = employee.metrics;

    const breakdown = {
      taskPerformance: Math.round(quality * 0.35),
      productivity: Math.round(productivity * 0.25),
      attendance: Math.round(attendance * 0.15),
      projectContribution: Math.round(15),
      teamwork: Math.round(teamwork * 0.1),
    };

    const total = Object.values(breakdown).reduce(
      (sum, value) => sum + value,
      0
    );

    return `Overall Performance Score Calculation:

• Task Completion Rate: 35% → ${quality}% × 0.35 = ${breakdown.taskPerformance} points
• Productivity: 25% → ${productivity}% × 0.25 = ${breakdown.productivity} points
• Attendance Rate: 15% → ${attendance}% × 0.15 = ${breakdown.attendance} points
• Project Contribution: 15% → ${breakdown.projectContribution} points
• Teamwork: 10% → ${teamwork}% × 0.10 = ${breakdown.teamwork} points

TOTAL: ${total} / 100`;
  };

  const getGoalStatusExplanation = (progress: number) => {
    if (progress >= 90)
      return "🎉 Excellent progress! Goal is considered completed.";
    if (progress >= 70)
      return "📈 Good progress, continue working towards completion.";
    return "⚠️ Needs attention. Progress is below expected levels.";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="h-4 w-8 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">No employee data found</div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Individual Performance</h3>
          <p className="text-sm text-muted-foreground">
            Detailed performance metrics for each employee
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {employees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback>
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription>
                      {employee.position} • {employee.department}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold">
                            {employee.currentPoints}
                          </span>
                          {getTrendIcon(employee.trend)}
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Performance Score
                        </p>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold">Score Calculation</h4>
                        </div>
                        <p className="text-sm whitespace-pre-line">
                          {getPerformanceScoreExplanation(employee)}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>

                  {(canCreatePerfomance || hasFullAccess) &&
                    employee.currentPoints < 70 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerateWarning(employee)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Generate Warning
                      </Button>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    Performance Metrics
                    <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(employee.metrics).map(([metric, value]) => (
                      <HoverCard key={metric}>
                        <HoverCardTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <div className="flex justify-between text-sm items-center">
                              <div className="flex items-center space-x-1">
                                <span className="capitalize">{metric}</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span>{value}%</span>
                            </div>
                            <Progress value={value as number} className="h-2" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calculator className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold capitalize">
                                {metric} Calculation
                              </h4>
                            </div>
                            <p className="text-sm whitespace-pre-line">
                              {getMetricExplanation(
                                metric,
                                value as number,
                                employee
                              )}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Current Goals</h4>
                  <div className="space-y-3">
                    {employee.goals.map((goal, index) => (
                      <HoverCard key={index}>
                        <HoverCardTrigger asChild>
                          <div className="space-y-1 cursor-help">
                            <div className="flex justify-between text-sm items-center">
                              <span>{goal.title}</span>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={
                                    goal.status === "Completed"
                                      ? "default"
                                      : goal.status === "Behind"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {goal.status}
                                </Badge>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calculator className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold">{goal.title}</h4>
                            </div>
                            <p className="text-sm">
                              Current Progress:{" "}
                              <strong>{goal.progress}%</strong>
                            </p>
                            <p className="text-sm whitespace-pre-line">
                              {getGoalStatusExplanation(goal.progress)}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              </div>

              {employee.warnings.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2 text-red-600">
                    Active Warnings
                  </h4>
                  {employee.warnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800">
                            {warning.type} Warning
                          </p>
                          <p className="text-sm text-red-600">
                            {warning.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">
                            {warning.severity}
                          </Badge>
                          <p className="text-xs text-red-600 mt-1">
                            {new Date(warning.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
