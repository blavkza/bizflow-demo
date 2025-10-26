import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LeaveRequest, Employee, ComboboxOption } from "../types";
import LeaveFilters from "./LeaveFilters";
import LeaveRequestCard from "./LeaveRequestCard";
import LeaveRequestForm from "./LeaveRequestForm";
import { Calendar, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LeaveRequestsTabProps {
  leaveRequests: LeaveRequest[];
  employeeOptions: ComboboxOption[];
  currentUser: Employee | null;
  onLeaveSubmit: (data: any) => Promise<boolean>;
  onLeaveStatusUpdate: (
    id: string,
    status: "APPROVED" | "REJECTED",
    comments?: string
  ) => Promise<boolean>;
}

export default function LeaveRequestsTab({
  leaveRequests,
  employeeOptions,
  currentUser,
  onLeaveSubmit,
  onLeaveStatusUpdate,
}: LeaveRequestsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleFormSubmit = async (formData: any): Promise<boolean> => {
    const success = await onLeaveSubmit(formData);
    if (success) {
      setIsNewLeaveOpen(false);
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LeaveFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/*  <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Leave for Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Leave for Employee</DialogTitle>
              <DialogDescription>
                Submit a leave request on behalf of an employee.
              </DialogDescription>
            </DialogHeader>
            <LeaveRequestForm
              employees={employeeOptions}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsNewLeaveOpen(false)}
            />
          </DialogContent>
        </Dialog> */}
      </div>

      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <LeaveRequestCard
            key={request.id}
            request={request}
            onApprove={() => onLeaveStatusUpdate(request.id, "APPROVED")}
            onReject={() => onLeaveStatusUpdate(request.id, "REJECTED")}
          />
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <Calendar className="h-12 w-12" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            No leave requests found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
