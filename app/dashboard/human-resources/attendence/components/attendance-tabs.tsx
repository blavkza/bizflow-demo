import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AttendanceRecord, CheckInRecord, EmergencyCallOut } from "../types";
import { FiltersSection } from "./filters-section";
import { AttendanceList } from "./attendance-list";
import { CheckInsList } from "./checkins-list";
import { ReportsSection } from "./reports-section";
import { OvertimeRequestsList } from "./overtime-requests-list";
import { CallOutList } from "./callout-list";

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
  callouts: EmergencyCallOut[];
  recordsLoading: boolean;
  checkinsLoading: boolean;
  calloutsLoading: boolean;
  bypassRules: any[];
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
  callouts,
  recordsLoading,
  checkinsLoading,
  calloutsLoading,
  bypassRules,
}: AttendanceTabsProps) {
  const filteredCallouts = callouts.filter((c) => {
    const person = c.employee || c.freeLancer || c.trainer;
    const name = person
      ? `${person.firstName || ""} ${person.lastName || ""}`
          .trim()
          .toLowerCase()
      : "";
    const id = (
      c.employee?.employeeNumber ||
      c.freeLancer?.freeLancerNumber ||
      c.trainer?.trainerNumber ||
      ""
    ).toLowerCase();
    const title = (c.title || "").toLowerCase();

    return (
      name.includes(searchTerm.toLowerCase()) ||
      id.includes(searchTerm.toLowerCase()) ||
      title.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Tabs defaultValue="attendance" className="space-y-4">
      <TabsList>
        <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
        <TabsTrigger value="checkins">All Check-ins</TabsTrigger>
        <TabsTrigger value="callouts">Emergency Call Outs</TabsTrigger>
        <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
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

      <TabsContent value="callouts" className="space-y-4">
        <CallOutList records={filteredCallouts} loading={calloutsLoading} />
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <ReportsSection attendanceRecords={attendanceRecords} />
      </TabsContent>

      <TabsContent value="overtime" className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Employee Overtime Requests</h3>
            <p className="text-sm text-muted-foreground">
              Manage and approve extra working hours
            </p>
          </div>
          <OvertimeRequestsList
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            selectedDepartment={selectedDepartment}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
