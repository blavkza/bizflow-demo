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
import { Dot, Plus } from "lucide-react";
import React, { useState } from "react";
import ProjectForm from "./project-Form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@prisma/client";

interface UserHeaderProps {
  fetchProjects: () => void;
  user: User;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function UserHeader({ fetchProjects, user }: UserHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 mb-4">
      <div className="flex items-center justify-between w-full">
        <div className="mb-6 flex items-center gap-2 mt-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={user.avatar || "/placeholder-user.jpg"}
              alt={user?.userName}
            />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-bold">Welcome, {user.name} 👋</h2>
            <p className="text-muted-foreground text-sm">
              Member since {new Date(user.createdAt).toLocaleDateString()}{" "}
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
