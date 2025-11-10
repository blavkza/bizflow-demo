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
import FreelancerForm from "./freelancer-Form";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  fetchFreelancers?: () => void;
  hasFullAccess: boolean;
  canCreateFreelancers: boolean;
}

export default function Header({
  fetchFreelancers,
  hasFullAccess,
  canCreateFreelancers,
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
            <h1 className="text-lg font-bold tracking-tight">Freelancers</h1>
            <p className="text-muted-foreground">
              Manage your freelancer members and their information
            </p>
          </div>
        </div>

        {(canCreateFreelancers || hasFullAccess) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Freelancer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Freelancer</DialogTitle>
                <DialogDescription>
                  Enter the freelancer's information to add them to your team.
                </DialogDescription>
              </DialogHeader>
              <FreelancerForm
                type="create"
                onCancel={() => setIsAddDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsAddDialogOpen(false);
                  router.refresh();
                  if (fetchFreelancers) fetchFreelancers();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
