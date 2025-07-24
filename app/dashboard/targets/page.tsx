"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Search,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock data for targets
const mockTargets = [
  {
    id: "1",
    title: "Q1 Revenue Target",
    description: "Achieve R2.5M in revenue for Q1 2024",
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
  },
  {
    id: "2",
    title: "Cost Reduction Initiative",
    description: "Reduce operational costs by 15%",
    type: "Financial",
    category: "Cost Reduction",
    targetValue: 15,
    currentValue: 8.5,
    unit: "%",
    progress: 57,
    status: "Behind",
    priority: "High",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    assignedTo: "Operations Team",
    department: "Operations",
  },
  {
    id: "3",
    title: "Customer Acquisition",
    description: "Acquire 500 new customers this quarter",
    type: "Performance",
    category: "Customer Growth",
    targetValue: 500,
    currentValue: 342,
    unit: "customers",
    progress: 68,
    status: "On Track",
    priority: "Medium",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    assignedTo: "Marketing Team",
    department: "Marketing",
  },
  {
    id: "4",
    title: "Employee Training Completion",
    description: "100% completion of mandatory training programs",
    type: "HR",
    category: "Training",
    targetValue: 100,
    currentValue: 85,
    unit: "%",
    progress: 85,
    status: "On Track",
    priority: "Medium",
    startDate: "2024-01-01",
    endDate: "2024-06-30",
    assignedTo: "HR Team",
    department: "Human Resources",
  },
  {
    id: "5",
    title: "Project Alpha Completion",
    description: "Complete Project Alpha by end of Q2",
    type: "Project",
    category: "Development",
    targetValue: 100,
    currentValue: 45,
    unit: "%",
    progress: 45,
    status: "Behind",
    priority: "High",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    assignedTo: "Development Team",
    department: "IT",
  },
];

const targetTypes = [
  "All",
  "Financial",
  "Performance",
  "HR",
  "Project",
  "Operational",
];
const statusOptions = ["All", "On Track", "Behind", "Completed", "At Risk"];
const priorityOptions = ["All", "High", "Medium", "Low"];

export default function TargetsPage() {
  const [targets] = useState(mockTargets);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTarget, setNewTarget] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    targetValue: "",
    unit: "",
    priority: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    assignedTo: "",
    department: "",
  });

  const filteredTargets = targets.filter((target) => {
    const matchesSearch =
      target.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || target.type === typeFilter;
    const matchesStatus =
      statusFilter === "All" || target.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || target.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Financial":
        return <DollarSign className="h-4 w-4" />;
      case "Performance":
        return <TrendingUp className="h-4 w-4" />;
      case "HR":
        return <Users className="h-4 w-4" />;
      case "Project":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const handleCreateTarget = () => {
    // Here you would typically send the data to your backend
    console.log("Creating target:", newTarget);
    setIsCreateDialogOpen(false);
    setNewTarget({
      title: "",
      description: "",
      type: "",
      category: "",
      targetValue: "",
      unit: "",
      priority: "",
      startDate: undefined,
      endDate: undefined,
      assignedTo: "",
      department: "",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Targets & Goals</h2>
          <p className="text-muted-foreground">
            Track and manage your organizational targets and performance goals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Target
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Target</DialogTitle>
                <DialogDescription>
                  Set up a new target or goal for your organization
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Target Title</Label>
                    <Input
                      id="title"
                      value={newTarget.title}
                      onChange={(e) =>
                        setNewTarget({ ...newTarget, title: e.target.value })
                      }
                      placeholder="Enter target title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTarget.type}
                      onValueChange={(value) =>
                        setNewTarget({ ...newTarget, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Performance">Performance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Operational">Operational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTarget.description}
                    onChange={(e) =>
                      setNewTarget({
                        ...newTarget,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the target in detail"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={newTarget.targetValue}
                      onChange={(e) =>
                        setNewTarget({
                          ...newTarget,
                          targetValue: e.target.value,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={newTarget.unit}
                      onChange={(e) =>
                        setNewTarget({ ...newTarget, unit: e.target.value })
                      }
                      placeholder="ZAR, %, units, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTarget.priority}
                      onValueChange={(value) =>
                        setNewTarget({ ...newTarget, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTarget.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTarget.startDate ? (
                            format(newTarget.startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTarget.startDate}
                          onSelect={(date) =>
                            setNewTarget({ ...newTarget, startDate: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTarget.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTarget.endDate ? (
                            format(newTarget.endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTarget.endDate}
                          onSelect={(date) =>
                            setNewTarget({ ...newTarget, endDate: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input
                      id="assignedTo"
                      value={newTarget.assignedTo}
                      onChange={(e) =>
                        setNewTarget({
                          ...newTarget,
                          assignedTo: e.target.value,
                        })
                      }
                      placeholder="Team or individual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newTarget.department}
                      onChange={(e) =>
                        setNewTarget({
                          ...newTarget,
                          department: e.target.value,
                        })
                      }
                      placeholder="Department name"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTarget}>Create Target</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search targets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {targetTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Targets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTargets.map((target) => (
          <Card key={target.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(target.type)}
                  <div>
                    <CardTitle className="text-lg">{target.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {target.category}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getPriorityColor(target.priority)}>
                  {target.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {target.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{target.progress}%</span>
                </div>
                <Progress value={target.progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {target.currentValue.toLocaleString()} {target.unit}
                  </span>
                  <span>
                    {target.targetValue.toLocaleString()} {target.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(
                      target.status
                    )}`}
                  />
                  <span className="text-sm">{target.status}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(target.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span>{target.assignedTo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department:</span>
                  <span>{target.department}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/targets/${target.id}`}>View Details</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Update Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTargets.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No targets found</h3>
          <p className="text-muted-foreground">
            {searchTerm ||
            typeFilter !== "All" ||
            statusFilter !== "All" ||
            priorityFilter !== "All"
              ? "Try adjusting your filters"
              : "Get started by creating your first target"}
          </p>
        </div>
      )}
    </div>
  );
}
