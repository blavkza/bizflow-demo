"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface FiltersProps {
  departments: string[];
  statuses: string[];
  workTypes: string[];
  onSearchChange: (term: string) => void;
  onDepartmentChange: (dept: string) => void;
  onStatusChange: (status: string) => void;
  onWorkTypeChange: (type: string) => void;
}

export default function Filters({
  departments,
  statuses,
  workTypes,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
  onWorkTypeChange,
}: FiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedWorkType, setSelectedWorkType] = useState("All Types");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearchChange(term);
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    onDepartmentChange(value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onStatusChange(value);
  };

  const handleWorkTypeChange = (value: string) => {
    setSelectedWorkType(value);
    onWorkTypeChange(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Directory</CardTitle>
        <CardDescription>Search and filter employees</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={selectedDepartment}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Departments">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Statuses">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedWorkType} onValueChange={handleWorkTypeChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Work Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Types">All Types</SelectItem>
              {workTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
