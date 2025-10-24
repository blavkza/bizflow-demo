"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import EmployeeForm from "./employee-Form";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  fetchEmployees?: () => void;
  hasFullAccess: boolean;
  canCreateEmployees: boolean;
}

export default function Header({
  fetchEmployees,
  hasFullAccess,
  canCreateEmployees,
}: HeaderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">
              Manage your team members and their information
            </p>
          </div>
        </div>

        {(canCreateEmployees || hasFullAccess) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh]  overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Enter the employee's information to add them to your team.
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm
                type="create"
                onCancel={() => setIsAddDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsAddDialogOpen(false);
                  router.refresh();
                  if (fetchEmployees) fetchEmployees();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
