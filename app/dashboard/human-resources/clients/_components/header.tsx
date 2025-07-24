"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ClientForm from "./client-Form";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center justify-between space-y-2">
      <header className="flex mb-4 h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              View your Clients and Manage information
            </p>
          </div>
        </div>
      </header>
      <div className="flex items-center space-x-2">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client profile. Fill in the required information
                below.
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              type="create"
              onCancel={() => setIsEditDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsEditDialogOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
