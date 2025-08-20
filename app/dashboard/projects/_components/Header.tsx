import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import ProjectForm from "./project-Form";

interface HeaderProps {
  fetchProjects: () => void;
}

export default function Header({ fetchProjects }: HeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 mb-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your Projects and their tasks
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              type="create"
              onCancel={() => setIsDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsDialogOpen(false);
                if (fetchProjects) fetchProjects();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
