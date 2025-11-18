import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FiltersSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  departmentOptions: string[];
}

export function FiltersSection({
  searchTerm,
  setSearchTerm,
  selectedDate,
  setSelectedDate,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  departmentOptions,
}: FiltersSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select
          value={selectedDepartment}
          onValueChange={setSelectedDepartment}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentOptions.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="Half Day">Half Day</SelectItem>
            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <div className="flex items-center justify-center w-full h-10 rounded-md border bg-muted/50">
          <Filter className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            {searchTerm ||
            selectedDepartment !== "All Departments" ||
            selectedStatus !== "All Status"
              ? "Filters Active"
              : "All Records"}
          </span>
        </div>
      </div>
    </div>
  );
}
