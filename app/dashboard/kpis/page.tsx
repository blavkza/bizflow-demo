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
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Target,
} from "lucide-react";

// Mock KPI data
const mockKPIs = [
  {
    id: "1",
    name: "Monthly Revenue",
    description: "Total monthly revenue in ZAR",
    currentValue: 1875000,
    previousValue: 1650000,
    targetValue: 2000000,
    unit: "ZAR",
    category: "Financial",
    frequency: "Monthly",
    trend: "up",
    changePercent: 13.6,
    status: "Good",
    lastUpdated: "2024-02-15",
  },
  {
    id: "2",
    name: "Customer Acquisition Cost",
    description: "Average cost to acquire a new customer",
    currentValue: 450,
    previousValue: 520,
    targetValue: 400,
    unit: "ZAR",
    category: "Marketing",
    frequency: "Monthly",
    trend: "down",
    changePercent: -13.5,
    status: "Improving",
    lastUpdated: "2024-02-14",
  },
  {
    id: "3",
    name: "Employee Satisfaction",
    description: "Average employee satisfaction score",
    currentValue: 8.2,
    previousValue: 7.9,
    targetValue: 8.5,
    unit: "/10",
    category: "HR",
    frequency: "Quarterly",
    trend: "up",
    changePercent: 3.8,
    status: "Good",
    lastUpdated: "2024-02-10",
  },
  {
    id: "4",
    name: "Project Completion Rate",
    description: "Percentage of projects completed on time",
    currentValue: 78,
    previousValue: 82,
    targetValue: 85,
    unit: "%",
    category: "Operations",
    frequency: "Monthly",
    trend: "down",
    changePercent: -4.9,
    status: "Needs Attention",
    lastUpdated: "2024-02-12",
  },
];

const categories = [
  "All",
  "Financial",
  "Marketing",
  "HR",
  "Operations",
  "Sales",
];
const frequencies = [
  "All",
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
];

export default function KPIsPage() {
  const [kpis] = useState(mockKPIs);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [frequencyFilter, setFrequencyFilter] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredKPIs = kpis.filter((kpi) => {
    const matchesSearch =
      kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || kpi.category === categoryFilter;
    const matchesFrequency =
      frequencyFilter === "All" || kpi.frequency === frequencyFilter;

    return matchesSearch && matchesCategory && matchesFrequency;
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "default";
      case "Improving":
        return "default";
      case "Needs Attention":
        return "destructive";
      case "Critical":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Financial":
        return <DollarSign className="h-4 w-4" />;
      case "HR":
        return <Users className="h-4 w-4" />;
      case "Operations":
        return <Target className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "ZAR") {
      return `R${value.toLocaleString()}`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Key Performance Indicators
          </h2>
          <p className="text-muted-foreground">
            Monitor and track your organization's key performance metrics
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
                Create KPI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New KPI</DialogTitle>
                <DialogDescription>
                  Set up a new key performance indicator to track
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">KPI Name</Label>
                    <Input id="name" placeholder="Enter KPI name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this KPI measures"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input id="targetValue" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" placeholder="ZAR, %, units, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
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
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create KPI
                </Button>
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
            placeholder="Search KPIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by frequency" />
          </SelectTrigger>
          <SelectContent>
            {frequencies.map((frequency) => (
              <SelectItem key={frequency} value={frequency}>
                {frequency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredKPIs.map((kpi) => (
          <Card key={kpi.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(kpi.category)}
                  <div>
                    <CardTitle className="text-lg">{kpi.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {kpi.category}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusColor(kpi.status)}>{kpi.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{kpi.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatValue(kpi.currentValue, kpi.unit)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(kpi.trend)}
                    <span
                      className={`text-sm font-medium ${
                        kpi.trend === "up"
                          ? "text-green-500"
                          : kpi.trend === "down"
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {kpi.changePercent > 0 ? "+" : ""}
                      {kpi.changePercent}%
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>
                      Previous: {formatValue(kpi.previousValue, kpi.unit)}
                    </span>
                    <span>
                      Target: {formatValue(kpi.targetValue, kpi.unit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span>{kpi.frequency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(kpi.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Update Value
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No KPIs found</h3>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== "All" || frequencyFilter !== "All"
              ? " adjusting your filters"
              : "Get started by creating your first KPI"}
          </p>
        </div>
      )}
    </div>
  );
}
