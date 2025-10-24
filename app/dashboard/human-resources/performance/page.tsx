"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  FileText,
  BarChart3,
} from "lucide-react";

// Mock performance data
const performanceData = [
  { month: "Jan", productivity: 85, quality: 90, attendance: 95, teamwork: 88 },
  { month: "Feb", productivity: 88, quality: 92, attendance: 93, teamwork: 90 },
  { month: "Mar", productivity: 82, quality: 88, attendance: 97, teamwork: 85 },
  { month: "Apr", productivity: 90, quality: 94, attendance: 96, teamwork: 92 },
  { month: "May", productivity: 87, quality: 91, attendance: 94, teamwork: 89 },
  { month: "Jun", productivity: 93, quality: 96, attendance: 98, teamwork: 94 },
];

const employeePerformance = [
  {
    id: "1",
    name: "John Smith",
    position: "Senior Developer",
    department: "Engineering",
    avatar: "/placeholder.svg?height=40&width=40",
    currentPoints: 85,
    previousPoints: 82,
    trend: "up",
    status: "Good",
    lastReview: "2024-01-15",
    goals: [
      { title: "Complete React Training", progress: 100, status: "Completed" },
      { title: "Lead Mobile Project", progress: 75, status: "In Progress" },
      { title: "Mentor Junior Devs", progress: 60, status: "In Progress" },
    ],
    warnings: [],
    metrics: {
      productivity: 88,
      quality: 92,
      attendance: 96,
      teamwork: 85,
    },
  },
  {
    id: "2",
    name: "Sarah Johnson",
    position: "Marketing Manager",
    department: "Marketing",
    avatar: "/placeholder.svg?height=40&width=40",
    currentPoints: 92,
    previousPoints: 89,
    trend: "up",
    status: "Excellent",
    lastReview: "2024-01-10",
    goals: [
      { title: "Q1 Campaign Launch", progress: 100, status: "Completed" },
      { title: "Brand Redesign", progress: 80, status: "In Progress" },
      { title: "Team Training", progress: 90, status: "In Progress" },
    ],
    warnings: [],
    metrics: {
      productivity: 94,
      quality: 96,
      attendance: 98,
      teamwork: 92,
    },
  },
  {
    id: "3",
    name: "Mike Brown",
    position: "Sales Representative",
    department: "Sales",
    avatar: "/placeholder.svg?height=40&width=40",
    currentPoints: 65,
    previousPoints: 72,
    trend: "down",
    status: "Needs Improvement",
    lastReview: "2024-01-05",
    goals: [
      { title: "Q1 Sales Target", progress: 45, status: "Behind" },
      { title: "Client Retention", progress: 70, status: "In Progress" },
      { title: "Product Training", progress: 30, status: "Behind" },
    ],
    warnings: [
      {
        id: 1,
        type: "Performance",
        date: "2024-01-20",
        reason: "Missed sales targets for 2 consecutive months",
        severity: "Written Warning",
      },
    ],
    metrics: {
      productivity: 65,
      quality: 70,
      attendance: 88,
      teamwork: 75,
    },
  },
];

const departmentStats = [
  { name: "Engineering", avgScore: 87, employees: 12, color: "#8884d8" },
  { name: "Marketing", avgScore: 91, employees: 8, color: "#82ca9d" },
  { name: "Sales", avgScore: 78, employees: 15, color: "#ffc658" },
  { name: "HR", avgScore: 89, employees: 5, color: "#ff7300" },
  { name: "Finance", avgScore: 85, employees: 6, color: "#00ff00" },
];

export default function EmployeePerformancePage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [selectedEmployeeForWarning, setSelectedEmployeeForWarning] =
    useState<string>("");

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

  const generateWarning = (employee: any) => {
    setSelectedEmployeeForWarning(employee.id);
    setIsWarningDialogOpen(true);
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

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.2</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Performers
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Employees above 90 points
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Attention
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Employees below 70 points
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Warnings
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Formal warnings issued
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          <TabsTrigger value="warnings">Warnings & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Average performance metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="productivity"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="quality"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#ffc658"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="teamwork"
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Average scores by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>
                Employee performance score distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Excellent (90-100)", value: 8, fill: "#22c55e" },
                      { name: "Good (80-89)", value: 15, fill: "#3b82f6" },
                      { name: "Average (70-79)", value: 12, fill: "#f59e0b" },
                      {
                        name: "Needs Improvement (<70)",
                        value: 3,
                        fill: "#ef4444",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Excellent (90-100)", value: 8, fill: "#22c55e" },
                      { name: "Good (80-89)", value: 15, fill: "#3b82f6" },
                      { name: "Average (70-79)", value: 12, fill: "#f59e0b" },
                      {
                        name: "Needs Improvement (<70)",
                        value: 3,
                        fill: "#ef4444",
                      },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="space-y-4">
            {employeePerformance.map((employee) => (
              <Card
                key={employee.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage
                          src={employee.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {employee.name}
                        </CardTitle>
                        <CardDescription>
                          {employee.position} • {employee.department}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold">
                            {employee.currentPoints}
                          </span>
                          {getTrendIcon(employee.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Performance Score
                        </p>
                      </div>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                      {employee.currentPoints < 70 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateWarning(employee)}
                          className="text-red-600 border-red-600"
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
                      <h4 className="font-medium mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        {Object.entries(employee.metrics).map(
                          ([metric, value]) => (
                            <div key={metric} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">{metric}</span>
                                <span>{value}%</span>
                              </div>
                              <Progress value={value} className="h-2" />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Current Goals</h4>
                      <div className="space-y-3">
                        {employee.goals.map((goal, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{goal.title}</span>
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
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
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
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
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
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departmentStats.map((dept) => (
              <Card key={dept.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{dept.name}</span>
                    <Badge variant="outline">{dept.employees} employees</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: dept.color }}
                      >
                        {dept.avgScore}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average Score
                      </p>
                    </div>
                    <Progress value={dept.avgScore} className="h-3" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">
                          {Math.floor((dept.avgScore / 100) * dept.employees)}
                        </div>
                        <div className="text-muted-foreground">
                          High Performers
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">
                          {dept.employees -
                            Math.floor((dept.avgScore / 100) * dept.employees)}
                        </div>
                        <div className="text-muted-foreground">
                          Need Support
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warning Management</CardTitle>
              <CardDescription>
                Automated warnings and performance actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Automatic Warning Triggers
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>
                      • Performance score below 70 for 2 consecutive months
                    </li>
                    <li>• Attendance rate below 85%</li>
                    <li>• Missing 3 or more goal deadlines</li>
                    <li>• Quality score below 60%</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  {employeePerformance
                    .filter((emp) => emp.warnings.length > 0)
                    .map((employee) => (
                      <div key={employee.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={employee.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.position}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">
                            {employee.warnings.length} Warning(s)
                          </Badge>
                        </div>
                        {employee.warnings.map((warning) => (
                          <div
                            key={warning.id}
                            className="ml-11 p-3 bg-red-50 border border-red-200 rounded"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-red-800">
                                  {warning.severity}
                                </p>
                                <p className="text-sm text-red-600">
                                  {warning.reason}
                                </p>
                              </div>
                              <p className="text-xs text-red-600">
                                {new Date(warning.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Warning Dialog */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Performance Warning</DialogTitle>
            <DialogDescription>
              Create a formal warning for performance issues.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="warningType">Warning Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select warning type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="conduct">Conduct</SelectItem>
                  <SelectItem value="goals">Goal Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal">Verbal Warning</SelectItem>
                  <SelectItem value="written">Written Warning</SelectItem>
                  <SelectItem value="final">Final Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Warning</Label>
              <Textarea
                id="reason"
                placeholder="Describe the performance issues and specific incidents..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionPlan">Improvement Action Plan</Label>
              <Textarea
                id="actionPlan"
                placeholder="Outline specific steps for improvement and timeline..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWarningDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsWarningDialogOpen(false)}>
              Generate Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
