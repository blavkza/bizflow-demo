"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
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
} from "recharts";

// Mock data for the target
const mockTarget = {
  id: "1",
  title: "Q1 Revenue Target",
  description:
    "Achieve R2.5M in revenue for Q1 2024 through increased sales activities and customer acquisition",
  type: "Financial",
  category: "Revenue",
  targetValue: 2500000,
  currentValue: 1875000,
  unit: "ZAR",
  progress: 75,
  status: "On Track",
  priority: "High",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
  assignedTo: "Sales Team",
  department: "Sales",
  createdBy: "John Smith",
  createdAt: "2024-01-01",
  lastUpdated: "2024-02-15",
};

// Mock progress data
const progressData = [
  { date: "Jan 1", value: 0, target: 833333 },
  { date: "Jan 15", value: 312500, target: 833333 },
  { date: "Feb 1", value: 625000, target: 1666666 },
  { date: "Feb 15", value: 1250000, target: 1666666 },
  { date: "Mar 1", value: 1875000, target: 2500000 },
  { date: "Mar 15", value: 1875000, target: 2500000 },
];

// Mock milestones
const mockMilestones = [
  {
    id: "1",
    title: "Q1 Month 1 Target",
    description: "Achieve R833K by end of January",
    targetDate: "2024-01-31",
    status: "Completed",
    progress: 100,
  },
  {
    id: "2",
    title: "Q1 Month 2 Target",
    description: "Achieve R1.67M by end of February",
    targetDate: "2024-02-29",
    status: "Completed",
    progress: 100,
  },
  {
    id: "3",
    title: "Q1 Final Target",
    description: "Achieve R2.5M by end of March",
    targetDate: "2024-03-31",
    status: "In Progress",
    progress: 75,
  },
];

// Mock activities
const mockActivities = [
  {
    id: "1",
    type: "update",
    message: "Progress updated to 75%",
    user: "Jane Doe",
    timestamp: "2024-02-15 14:30",
  },
  {
    id: "2",
    type: "comment",
    message: "Great progress this month! We're ahead of schedule.",
    user: "John Smith",
    timestamp: "2024-02-14 09:15",
  },
  {
    id: "3",
    type: "milestone",
    message: "Milestone 'Q1 Month 2 Target' completed",
    user: "System",
    timestamp: "2024-02-29 23:59",
  },
];

export default function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [target] = useState(mockTarget);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [newProgress, setNewProgress] = useState(target.progress.toString());
  const [newComment, setNewComment] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-500";
      case "Behind":
        return "bg-red-500";
      case "At Risk":
        return "bg-yellow-500";
      case "Completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "default";
    }
  };

  const daysRemaining = Math.ceil(
    (new Date(target.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/targets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{target.title}</h1>
          <p className="text-muted-foreground">{target.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isUpdateProgressOpen}
            onOpenChange={setIsUpdateProgressOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Update Progress
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Progress</DialogTitle>
                <DialogDescription>
                  Update the current progress for this target
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment about this update..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateProgressOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsUpdateProgressOpen(false)}>
                  Update Progress
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Target
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Progress
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{target.progress}%</div>
            <Progress value={target.progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{target.currentValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of R{target.targetValue.toLocaleString()} target
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Days Remaining
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRemaining}</div>
            <p className="text-xs text-muted-foreground">
              Until {new Date(target.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(
                target.status,
              )}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{target.status}</div>
            <Badge variant={getPriorityColor(target.priority)} className="mt-1">
              {target.priority} Priority
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Target Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-muted-foreground">
                      {target.type}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">
                      {target.category}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(target.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(target.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm text-muted-foreground">
                      {target.assignedTo}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-muted-foreground">
                      {target.department}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `R${Number(value).toLocaleString()}`,
                        "",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Track progress over time with detailed metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R${Number(value).toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Milestones</h3>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
          <div className="space-y-4">
            {mockMilestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {milestone.status === "Completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            Due:{" "}
                            {new Date(
                              milestone.targetDate,
                            ).toLocaleDateString()}
                          </span>
                          <span>Progress: {milestone.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        milestone.status === "Completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                  {milestone.status !== "Completed" && (
                    <div className="mt-3">
                      <Progress value={milestone.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Recent updates and comments on this target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 pb-4 border-b last:border-b-0"
                  >
                    <div className="flex-shrink-0">
                      {activity.type === "update" && (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      )}
                      {activity.type === "comment" && (
                        <MessageSquare className="h-4 w-4 text-green-500" />
                      )}
                      {activity.type === "milestone" && (
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
