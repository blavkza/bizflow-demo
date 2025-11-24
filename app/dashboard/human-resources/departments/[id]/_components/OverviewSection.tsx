"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  DollarSign,
  PenLine,
  UserPlus,
  Calendar,
} from "lucide-react";

import { TabsContent } from "@/components/ui/tabs";
import { Department } from "@/types/department";

export interface OverviewSectionProps {
  department: Department;
}

export default function OverviewSection({ department }: OverviewSectionProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate team statistics
  const totalTeamMembers =
    department.employees.length + department.freelancers.length;
  const activeFreelancers = department.freelancers.filter(
    (f) => f.status === "ACTIVE"
  ).length;

  // Calculate total monthly salary cost
  const totalMonthlyCost =
    department.employees.reduce((sum, emp) => {
      const monthlySalary =
        emp.salaryType === "MONTHLY"
          ? Number(emp.monthlySalary)
          : Number(emp.dailySalary) * 22; // Approximate monthly (22 working days)
      return sum + monthlySalary;
    }, 0) +
    department.freelancers.reduce(
      (sum, freelancer) => sum + Number(freelancer.salary),
      0
    );

  // Get latest team member (employee or freelancer)
  const getLatestTeamMember = () => {
    const allMembers = [
      ...department.employees.map((emp) => ({
        ...emp,
        type: "employee",
        date: emp.createdAt,
      })),
      ...department.freelancers.map((freelancer) => ({
        ...freelancer,
        type: "freelancer",
        date: freelancer.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allMembers[0];
  };

  const latestMember = getLatestTeamMember();

  return (
    <TabsContent value="overview" className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {department.employees.length} employees +{" "}
              {department.freelancers.length} freelancers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Freelancers
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFreelancers}</div>
            <p className="text-xs text-muted-foreground">
              of {department.freelancers.length} total freelancers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{" "}
              {totalMonthlyCost.toLocaleString("en-ZA", {
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly salary cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {department.status.toLowerCase()}
            </div>
            <p className="text-xs text-muted-foreground">Department status</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Information */}
        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>
              Basic information about the department
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="mt-1">
                {department.description || "No description provided"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Manager
                </h3>
                <p className="mt-1">
                  {department.manager?.name || "No manager assigned"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Location
                </h3>
                <p className="mt-1">
                  {department.location || "No location specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Building
                </h3>
                <p className="mt-1">{department.building || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Floor
                </h3>
                <p className="mt-1">{department.floor || "Not specified"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Created
                </h3>
                <p className="mt-1">{formatDate(department.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </h3>
                <p className="mt-1">{formatDate(department.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Team Composition</CardTitle>
            <CardDescription>Breakdown of team members by type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Employees</span>
                <span className="text-sm text-muted-foreground">
                  {department.employees.length} members
                </span>
              </div>
              <Progress
                value={
                  totalTeamMembers > 0
                    ? (department.employees.length / totalTeamMembers) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Freelancers</span>
                <span className="text-sm text-muted-foreground">
                  {department.freelancers.length} members
                </span>
              </div>
              <Progress
                value={
                  totalTeamMembers > 0
                    ? (department.freelancers.length / totalTeamMembers) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {department.employees.length}
                </div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {department.freelancers.length}
                </div>
                <div className="text-sm text-muted-foreground">Freelancers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest activities in the department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Latest Team Member */}
            {latestMember && (
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-100 p-2">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New {latestMember.type} added</p>
                  <p className="text-sm text-muted-foreground">
                    {`${latestMember.firstName} ${latestMember.lastName} joined as ${latestMember.position}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(new Date(latestMember.date))}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    latestMember.type === "employee"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {latestMember.type}
                </span>
              </div>
            )}

            {/* Department Update */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-2">
                <PenLine className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Department updated</p>
                <p className="text-sm text-muted-foreground">
                  {department.manager?.name
                    ? `Last modified by ${department.manager.name}`
                    : "Department information updated"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(department.updatedAt)}
                </p>
              </div>
            </div>

            {/* Department Creation */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Department created</p>
                <p className="text-sm text-muted-foreground">
                  Department was added to the system
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(department.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
