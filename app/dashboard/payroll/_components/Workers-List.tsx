"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkerWithDetails } from "@/types/payroll";
import { useRouter } from "next/navigation";
import { Users, UserCheck, Briefcase, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkersListProps {
  employees: WorkerWithDetails[];
  canViewEmployee: boolean;
  hasFullAccess: boolean;
}

type WorkerFilter = "all" | "employees" | "freelancers";

export default function WorkersList({
  employees,
  canViewEmployee,
  hasFullAccess,
}: WorkersListProps) {
  const router = useRouter();
  const [workerFilter, setWorkerFilter] = useState<WorkerFilter>("all");

  // Filter workers based on selected filter
  const filteredWorkers = employees.filter((employee) => {
    if (workerFilter === "all") return true;
    if (workerFilter === "employees") return !employee.isFreelancer;
    if (workerFilter === "freelancers") return employee.isFreelancer;
    return true;
  });

  const getWorkerTypeLabel = (employee: WorkerWithDetails) => {
    return employee.isFreelancer ? "Freelancer" : "Employee";
  };

  const getWorkerTypeIcon = (employee: WorkerWithDetails) => {
    return employee.isFreelancer ? Briefcase : UserCheck;
  };

  const getWorkerTypeBadge = (employee: WorkerWithDetails) => {
    const Icon = getWorkerTypeIcon(employee);
    return (
      <Badge
        variant={employee.isFreelancer ? "secondary" : "outline"}
        className="flex items-center gap-1 w-20"
      >
        <Icon className="h-3 w-3" />
        {getWorkerTypeLabel(employee)}
      </Badge>
    );
  };

  const getDailyRate = (employee: WorkerWithDetails) => {
    if (employee.isFreelancer) {
      return Number(employee.salary);
    } else {
      const emp = employee as any;

      if (employee.salaryType === "DAILY") {
        return Number(emp.dailySalary || emp.salary || 0);
      } else {
        const monthlySalary = Number(emp.monthlySalary || emp.salary || 0);
        return monthlySalary;
      }
    }
  };

  const getWorkerNumber = (employee: WorkerWithDetails) => {
    if (employee.isFreelancer) {
      return (employee as any).freeLancerNumber || "N/A";
    } else {
      return employee.employeeNumber || "N/A";
    }
  };

  // Count workers by type
  const employeesCount = employees.filter((emp) => !emp.isFreelancer).length;
  const freelancersCount = employees.filter((emp) => emp.isFreelancer).length;
  const totalCount = employees.length;

  const getFilterLabel = () => {
    switch (workerFilter) {
      case "all":
        return `All Workers (${totalCount})`;
      case "employees":
        return `Employees (${employeesCount})`;
      case "freelancers":
        return `Freelancers (${freelancersCount})`;
      default:
        return "Filter Workers";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Workers Directory</CardTitle>
            <CardDescription>
              Manage all workers information and payroll details
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {getFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setWorkerFilter("all")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                All Workers ({totalCount})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setWorkerFilter("employees")}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Employees ({employeesCount})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setWorkerFilter("freelancers")}
                className="flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Freelancers ({freelancersCount})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Summary */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span>Showing:</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {filteredWorkers.filter((emp) => !emp.isFreelancer).length}{" "}
              Employees
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {filteredWorkers.filter((emp) => emp.isFreelancer).length}{" "}
              Freelancers
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Daily/Monthly Rate</TableHead>
              <TableHead>Salary Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.map((employee) => {
              const WorkerTypeIcon = getWorkerTypeIcon(employee);
              const dailyRate = getDailyRate(employee);

              return (
                <TableRow
                  key={employee.id}
                  /*  onClick={() => {
                    if (canViewEmployee || hasFullAccess) {
                      router.push(`/dashboard/payroll/${employee.id}`);
                    }
                  }} */
                  className=" hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage
                          src={employee.avatar || "/placeholder.svg"}
                          alt={`${employee.firstName} ${employee.lastName}`}
                        />
                        <AvatarFallback>
                          {`${employee.firstName?.[0] || ""}${
                            employee.lastName?.[0] || ""
                          }`}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{`${employee.firstName} ${employee.lastName}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {getWorkerNumber(employee)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getWorkerTypeBadge(employee)}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department?.name || "N/A"}</TableCell>
                  <TableCell>
                    R
                    {dailyRate.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {employee.isFreelancer ? "DAILY" : employee.salaryType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.hireDate
                      ? new Date(employee.hireDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredWorkers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workers found matching your criteria</p>
            {workerFilter !== "all" && (
              <p className="text-sm mt-2">
                Try changing the filter to see more workers
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
