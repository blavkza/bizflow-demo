import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AttendanceRecord, CheckInRecord } from "../types";
import { FiltersSection } from "./filters-section";
import { AttendanceList } from "./attendance-list";
import { CheckInsList } from "./checkins-list";
import { ReportsSection } from "./reports-section";

interface AttendanceTabsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  departmentOptions: string[];
  attendanceRecords: AttendanceRecord[];
  filteredAttendance: AttendanceRecord[];
  gpsCheckIns: CheckInRecord[];
  recordsLoading: boolean;
  checkinsLoading: boolean;
  bypassRules: any[]; // NEW PROP
}

export function AttendanceTabs({
  searchTerm,
  setSearchTerm,
  selectedDate,
  setSelectedDate,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  departmentOptions,
  attendanceRecords,
  filteredAttendance,
  gpsCheckIns,
  recordsLoading,
  checkinsLoading,
  bypassRules, // NEW PROP
}: AttendanceTabsProps) {
  return (
    <Tabs defaultValue="attendance" className="space-y-4">
      <TabsList>
        <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
        <TabsTrigger value="checkins">All Check-ins</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <FiltersSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        departmentOptions={departmentOptions}
      />
      <TabsContent value="attendance" className="space-y-4">
        <AttendanceList
          records={filteredAttendance}
          loading={recordsLoading}
          bypassRules={bypassRules} // PASS DOWN
          onClearFilters={() => {
            setSearchTerm("");
            setSelectedDepartment("All Departments");
            setSelectedStatus("All Status");
          }}
        />
      </TabsContent>

      <TabsContent value="checkins" className="space-y-4">
        <CheckInsList checkins={gpsCheckIns} loading={checkinsLoading} />
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <ReportsSection attendanceRecords={attendanceRecords} />
      </TabsContent>
    </Tabs>
  );
}
