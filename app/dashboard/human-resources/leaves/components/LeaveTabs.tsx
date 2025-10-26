import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LeaveRequest,
  LeaveBalances,
  Employee,
  ComboboxOption,
} from "../types";
import LeaveRequestsTab from "./LeaveRequestsTab";
import LeaveCalendarTab from "./LeaveCalendarTab";

interface LeaveTabsProps {
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalances | null;
  employeeOptions: ComboboxOption[];
  currentUser: Employee | null;
  onLeaveSubmit: (data: any) => Promise<boolean>;
  onLeaveStatusUpdate: (
    id: string,
    status: "APPROVED" | "REJECTED",
    comments?: string
  ) => Promise<boolean>;
}

export default function LeaveTabs({
  leaveRequests,
  leaveBalances,
  employeeOptions,
  currentUser,
  onLeaveSubmit,
  onLeaveStatusUpdate,
}: LeaveTabsProps) {
  return (
    <Tabs defaultValue="requests" className="space-y-4">
      <TabsList>
        <TabsTrigger value="requests">Leave Requests</TabsTrigger>
        <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
      </TabsList>

      <TabsContent value="requests" className="space-y-4">
        <LeaveRequestsTab
          leaveRequests={leaveRequests}
          employeeOptions={employeeOptions}
          currentUser={currentUser}
          onLeaveSubmit={onLeaveSubmit}
          onLeaveStatusUpdate={onLeaveStatusUpdate}
        />
      </TabsContent>

      <TabsContent value="calendar" className="space-y-4">
        <LeaveCalendarTab leaveRequests={leaveRequests} />
      </TabsContent>
    </Tabs>
  );
}
