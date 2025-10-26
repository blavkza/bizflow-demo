"use client";

import { useState, useEffect } from "react";
import {
  LeaveRequest,
  LeaveBalances,
  Employee,
  ComboboxOption,
} from "../types";
import LeaveStats from "./LeaveStats";
import LeaveTabs from "./LeaveTabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LeaveRequestForm from "./LeaveRequestForm";
import { toast } from "@/components/ui/use-toast";

export default function LeavesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalances | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch leave requests
        const leavesResponse = await fetch("/api/leaves");
        if (leavesResponse.ok) {
          const leavesData = await leavesResponse.json();
          setLeaveRequests(leavesData);
        } else {
          throw new Error("Failed to fetch leave requests");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Format employees for combobox
  const employeeOptions: ComboboxOption[] = employees.map((emp) => ({
    value: emp.employeeNumber,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeNumber}) - ${emp.department?.name || "No Department"}`,
  }));

  // Handle leave submission
  const handleSubmitLeave = async (formData: any) => {
    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          requestedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
        }),
      });

      if (response.ok) {
        // Refresh leave requests
        const requestsResponse = await fetch("/api/leaves");
        if (requestsResponse.ok) {
          const data = await requestsResponse.json();
          setLeaveRequests(data);
        }

        setIsNewLeaveOpen(false);
        toast({
          title: "Leave Request Submitted",
          description: `Leave request for employee has been submitted for approval.`,
        });
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle leave approval/rejection
  const handleUpdateLeaveStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED",
    comments?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...(status === "APPROVED"
            ? {
                approvedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
              }
            : {
                rejectedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
                comments: comments || "Leave request rejected",
              }),
        }),
      });

      if (response.ok) {
        // Update local state
        setLeaveRequests((prev) =>
          prev.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status,
                  ...(status === "APPROVED"
                    ? {
                        approvedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
                        approvedDate: new Date().toISOString().split("T")[0],
                      }
                    : {
                        rejectedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
                        rejectedDate: new Date().toISOString().split("T")[0],
                        comments: comments || "Leave request rejected",
                      }),
                }
              : request
          )
        );

        toast({
          title: `Leave ${status === "APPROVED" ? "Approved" : "Rejected"}`,
          description: `The leave request has been ${status.toLowerCase()} successfully.`,
          variant: status === "REJECTED" ? "destructive" : "default",
        });
        return true;
      } else {
        throw new Error(`Failed to ${status.toLowerCase()} leave`);
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing leave:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} leave request`,
        variant: "destructive",
      });
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Leave Management
            </h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Leave Management
          </h2>
          <p className="text-muted-foreground">
            Manage employee leave requests and balances
          </p>
        </div>

        {/* ALWAYS SHOW THE BUTTON - NO PERMISSION CHECK */}
        <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
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
              onSubmit={handleSubmitLeave}
              onCancel={() => setIsNewLeaveOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <LeaveStats leaveRequests={leaveRequests} />

      <LeaveTabs
        leaveRequests={leaveRequests}
        leaveBalances={leaveBalances}
        employeeOptions={employeeOptions}
        currentUser={currentUser}
        onLeaveSubmit={handleSubmitLeave}
        onLeaveStatusUpdate={handleUpdateLeaveStatus}
      />
    </div>
  );
}
