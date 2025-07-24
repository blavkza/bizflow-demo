"use client";

import { useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

// Mock data for KPI details
const kpiData = {
  id: "1",
  name: "Monthly Revenue",
  description: "Track monthly revenue performance against targets",
  category: "Financial",
  currentValue: 850000,
  targetValue: 1000000,
  unit: "ZAR",
  frequency: "Monthly",
  status: "Needs Attention",
  trend: "down",
  trendPercentage: -5.2,
  owner: "John Smith",
  department: "Sales",
  lastUpdated: "2024-01-15",
  createdDate: "2024-01-01",
  priority: "High",
};

const historicalData = [
  { month: "Jul", actual: 920000, target: 1000000 },
  { month: "Aug", actual: 880000, target: 1000000 },
  { month: "Sep", actual: 950000, target: 1000000 },
  { month: "Oct", actual: 890000, target: 1000000 },
  { month: "Nov", actual: 870000, target: 1000000 },
  { month: "Dec", actual: 850000, target: 1000000 },
];

const benchmarkData = [
  { period: "Q1 2023", value: 920000 },
  { period: "Q2 2023", value: 950000 },
  { period: "Q3 2023", value: 880000 },
  { period: "Q4 2023", value: 890000 },
  { period: "Q1 2024", value: 850000 },
];

const activities = [
  {
    id: 1,
    type: "update",
    message: "KPI value updated to R850,000",
    user: "John Smith",
    timestamp: "2024-01-15 14:30",
    icon: Activity,
  },
  {
    id: 2,
    type: "alert",
    message: "KPI performance below target threshold",
    user: "System",
    timestamp: "2024-01-15 09:00",
    icon: AlertTriangle,
  },
  {
    id: 3,
    type: "target",
    message: "Target adjusted from R950,000 to R1,000,000",
    user: "Sarah Johnson",
    timestamp: "2024-01-10 11:15",
    icon: Target,
  },
  {
    id: 4,
    type: "milestone",
    message: "Q4 milestone completed",
    user: "John Smith",
    timestamp: "2024-01-05 16:45",
    icon: CheckCircle,
  },
];

const relatedKPIs = [
  {
    id: 2,
    name: "Customer Acquisition Cost",
    value: 1250,
    target: 1000,
    unit: "ZAR",
    status: "At Risk",
  },
  {
    id: 3,
    name: "Conversion Rate",
    value: 3.2,
    target: 4.0,
    unit: "%",
    status: "Needs Attention",
  },
  {
    id: 4,
    name: "Average Deal Size",
    value: 45000,
    target: 50000,
    unit: "ZAR",
    status: "On Track",
  },
];

export default function KPIDetailPage({ params }: { params: { id: string } }) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [updateComment, setUpdateComment] = useState("");

  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "bg-green-100 text-green-800";
      case "On Track":
        return "bg-blue-100 text-blue-800";
      case "Improving":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Attention":
        return "bg-orange-100 text-orange-800";
      case "At Risk":
        return "bg-red-100 text-red-800";
      case "Critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const progressPercentage = (kpiData.currentValue / kpiData.targetValue) * 100;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/kpis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{kpiData.name}</h1>
            <p className="text-muted-foreground">{kpiData.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>Update Value</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update KPI Value</DialogTitle>
                <DialogDescription>
                  Update the current value for {kpiData.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="value">New Value ({kpiData.unit})</Label>
                  <Input
                    id="value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter new value"
                  />
                </div>
                <div>
                  <Label htmlFor="comment">Comment (Optional)</Label>
                  <Textarea
                    id="comment"
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                    placeholder="Add a comment about this update"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsUpdateDialogOpen(false)}>
                  Update KPI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.unit === "ZAR"
                ? `R${kpiData.currentValue.toLocaleString()}`
                : `${kpiData.currentValue}${kpiData.unit}`}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {kpiData.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={
                  kpiData.trend === "up" ? "text-green-500" : "text-red-500"
                }
              >
                {kpiData.trendPercentage > 0 ? "+" : ""}
                {kpiData.trendPercentage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.unit === "ZAR"
                ? `R${kpiData.targetValue.toLocaleString()}`
                : `${kpiData.targetValue}${kpiData.unit}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {kpiData.frequency} target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressPercentage.toFixed(1)}%
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(kpiData.status)}>
              {kpiData.status}
            </Badge>
            <div className="text-sm text-muted-foreground mt-2">
              Last updated: {kpiData.lastUpdated}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Actual vs Target over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `R${value.toLocaleString()}`,
                          "",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Related KPIs</CardTitle>
                  <CardDescription>
                    Other KPIs that may impact this metric
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatedKPIs.map((kpi) => (
                      <div
                        key={kpi.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{kpi.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {kpi.unit === "ZAR"
                              ? `R${kpi.value.toLocaleString()}`
                              : `${kpi.value}${kpi.unit}`}{" "}
                            /
                            {kpi.unit === "ZAR"
                              ? ` R${kpi.target.toLocaleString()}`
                              : ` ${kpi.target}${kpi.unit}`}
                          </p>
                        </div>
                        <Badge className={getStatusColor(kpi.status)}>
                          {kpi.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>KPI Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">
                      {kpiData.category}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Owner</Label>
                    <p className="text-sm text-muted-foreground">
                      {kpiData.owner}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-muted-foreground">
                      {kpiData.department}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Frequency</Label>
                    <p className="text-sm text-muted-foreground">
                      {kpiData.frequency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge className={getPriorityColor(kpiData.priority)}>
                      {kpiData.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {kpiData.createdDate}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Adjust Target Dialog */}
                  <Dialog
                    open={isTargetDialogOpen}
                    onOpenChange={setIsTargetDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Adjust Target
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Adjust KPI Target</DialogTitle>
                        <DialogDescription>
                          Update the target value for {kpiData.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="current-target">Current Target</Label>
                          <Input
                            id="current-target"
                            value={`${
                              kpiData.unit === "ZAR" ? "R" : ""
                            }${kpiData.targetValue.toLocaleString()}${
                              kpiData.unit !== "ZAR" ? kpiData.unit : ""
                            }`}
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-target">
                            New Target ({kpiData.unit})
                          </Label>
                          <Input
                            id="new-target"
                            type="number"
                            placeholder="Enter new target value"
                          />
                        </div>
                        <div>
                          <Label htmlFor="target-reason">
                            Reason for Change
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="market-conditions">
                                Market Conditions
                              </SelectItem>
                              <SelectItem value="business-growth">
                                Business Growth
                              </SelectItem>
                              <SelectItem value="strategy-change">
                                Strategy Change
                              </SelectItem>
                              <SelectItem value="performance-review">
                                Performance Review
                              </SelectItem>
                              <SelectItem value="budget-adjustment">
                                Budget Adjustment
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="effective-date">Effective Date</Label>
                          <Input id="effective-date" type="date" />
                        </div>
                        <div>
                          <Label htmlFor="target-notes">Additional Notes</Label>
                          <Textarea
                            id="target-notes"
                            placeholder="Add any additional context or notes..."
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="notify-team"
                            className="rounded"
                          />
                          <Label htmlFor="notify-team" className="text-sm">
                            Notify team members
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsTargetDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsTargetDialogOpen(false)}>
                          Update Target
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Set Reminder Dialog */}
                  <Dialog
                    open={isReminderDialogOpen}
                    onOpenChange={setIsReminderDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Set Reminder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Set KPI Reminder</DialogTitle>
                        <DialogDescription>
                          Create a reminder for {kpiData.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reminder-type">Reminder Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reminder type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="update-value">
                                Update KPI Value
                              </SelectItem>
                              <SelectItem value="review-performance">
                                Review Performance
                              </SelectItem>
                              <SelectItem value="target-deadline">
                                Target Deadline
                              </SelectItem>
                              <SelectItem value="monthly-review">
                                Monthly Review
                              </SelectItem>
                              <SelectItem value="quarterly-review">
                                Quarterly Review
                              </SelectItem>
                              <SelectItem value="custom">
                                Custom Reminder
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="reminder-date">Date</Label>
                            <Input id="reminder-date" type="date" />
                          </div>
                          <div>
                            <Label htmlFor="reminder-time">Time</Label>
                            <Input
                              id="reminder-time"
                              type="time"
                              defaultValue="09:00"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="reminder-frequency">Frequency</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">One-time</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">
                                Quarterly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="reminder-message">
                            Custom Message
                          </Label>
                          <Textarea
                            id="reminder-message"
                            placeholder="Enter custom reminder message..."
                            className="min-h-[80px]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reminder-recipients">Notify</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select who to notify" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="me">Just me</SelectItem>
                              <SelectItem value="owner">
                                KPI Owner ({kpiData.owner})
                              </SelectItem>
                              <SelectItem value="team">Entire team</SelectItem>
                              <SelectItem value="department">
                                Department ({kpiData.department})
                              </SelectItem>
                              <SelectItem value="custom">
                                Custom recipients
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsReminderDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsReminderDialogOpen(false)}>
                          Set Reminder
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Share KPI Dialog */}
                  <Dialog
                    open={isShareDialogOpen}
                    onOpenChange={setIsShareDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Share KPI
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Share KPI</DialogTitle>
                        <DialogDescription>
                          Share {kpiData.name} with team members or stakeholders
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="share-with">Share With</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipients" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="team">My Team</SelectItem>
                              <SelectItem value="department">
                                Department ({kpiData.department})
                              </SelectItem>
                              <SelectItem value="management">
                                Management
                              </SelectItem>
                              <SelectItem value="stakeholders">
                                Key Stakeholders
                              </SelectItem>
                              <SelectItem value="custom">
                                Custom Recipients
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="share-permissions">
                            Permission Level
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select permission level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View Only</SelectItem>
                              <SelectItem value="comment">
                                View & Comment
                              </SelectItem>
                              <SelectItem value="edit">View & Edit</SelectItem>
                              <SelectItem value="admin">Full Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="share-format">Share Format</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dashboard">
                                Dashboard Link
                              </SelectItem>
                              <SelectItem value="email">
                                Email Report
                              </SelectItem>
                              <SelectItem value="pdf">PDF Export</SelectItem>
                              <SelectItem value="excel">
                                Excel Export
                              </SelectItem>
                              <SelectItem value="presentation">
                                Presentation Slides
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="share-frequency">
                            Update Frequency
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="real-time">
                                Real-time
                              </SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="on-demand">
                                On-demand only
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="share-message">
                            Message (Optional)
                          </Label>
                          <Textarea
                            id="share-message"
                            placeholder="Add a message to recipients..."
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="include-historical"
                              className="rounded"
                              defaultChecked
                            />
                            <Label
                              htmlFor="include-historical"
                              className="text-sm"
                            >
                              Include historical data
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="include-targets"
                              className="rounded"
                              defaultChecked
                            />
                            <Label
                              htmlFor="include-targets"
                              className="text-sm"
                            >
                              Include target information
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="auto-update"
                              className="rounded"
                            />
                            <Label htmlFor="auto-update" className="text-sm">
                              Auto-update recipients
                            </Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsShareDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsShareDialogOpen(false)}>
                          Share KPI
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Analysis</CardTitle>
              <CardDescription>
                In-depth view of KPI performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`R${value.toLocaleString()}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="Target"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stackId="2"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Actual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Benchmarks</CardTitle>
              <CardDescription>
                Compare current performance with historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R${value.toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Recent updates and changes to this KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.user} • {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPI Settings</CardTitle>
              <CardDescription>
                Configure KPI parameters and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="kpi-name">KPI Name</Label>
                    <Input id="kpi-name" defaultValue={kpiData.name} />
                  </div>
                  <div>
                    <Label htmlFor="kpi-description">Description</Label>
                    <Textarea
                      id="kpi-description"
                      defaultValue={kpiData.description}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kpi-category">Category</Label>
                    <Select defaultValue={kpiData.category}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="kpi-target">Target Value</Label>
                    <Input id="kpi-target" defaultValue={kpiData.targetValue} />
                  </div>
                  <div>
                    <Label htmlFor="kpi-frequency">Frequency</Label>
                    <Select defaultValue={kpiData.frequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kpi-priority">Priority</Label>
                    <Select defaultValue={kpiData.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
