import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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

const statusOptions = [
  "All Status",
  "Present",
  "Late",
  "Absent",
  "Annual Leave",
  "Sick Leave",
];

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
    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-[180px]"
      />
      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          {departmentOptions.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
