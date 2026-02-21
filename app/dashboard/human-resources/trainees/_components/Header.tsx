"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import TraineeForm from "./trainee-Form";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  fetchTrainees?: () => void;
  hasFullAccess: boolean;
  canCreateTrainees: boolean;
}

export default function Header({
  fetchTrainees,
  hasFullAccess,
  canCreateTrainees,
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
            <h1 className="text-lg font-bold tracking-tight">
              Funded Trainees
            </h1>
            <p className="text-muted-foreground">
              Manage your funded trainees and their information
            </p>
          </div>
        </div>

        {(canCreateTrainees || hasFullAccess) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Funded Trainee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Funded Trainee</DialogTitle>
                <DialogDescription>
                  Enter the funded trainee's information to add them to your
                  team.
                </DialogDescription>
              </DialogHeader>
              <TraineeForm
                type="create"
                onCancel={() => setIsAddDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsAddDialogOpen(false);
                  router.refresh();
                  if (fetchTrainees) fetchTrainees();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
