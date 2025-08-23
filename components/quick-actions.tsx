"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileText, Upload, Download } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import TransactionForm from "@/app/dashboard/transactions/_components/Transaction-Form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ClientForm from "@/app/dashboard/human-resources/clients/_components/client-Form";
import ProjectForm from "@/app/dashboard/projects/_components/project-Form";

export function QuickActions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-2">
      <h3 className="text-lg font-semibold p-2">Quick Actions</h3>
      <Button variant="outline" className="h-16 w-30 flex-col gap-2">
        <Link
          className="flex flex-col gap-3 items-center "
          href={"/dashboard/invoices/new"}
        >
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </Link>
      </Button>
      <Button variant="outline" className="h-16 w-30 flex-col gap-2">
        <Link
          className="flex flex-col gap-3 items-center "
          href={"/dashboard/invoices/new"}
        >
          {" "}
          <Plus className="h-4 w-4" />
          <span>Create Quote</span>
        </Link>
      </Button>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-16 w-30 flex-col gap-2">
            <Plus className="h-4 w-4" />
            <span>Transation</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Enter the details for the new financial transaction.
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            type="create"
            onCancel={() => setIsAddDialogOpen(false)}
            onSubmitSuccess={() => {
              setIsAddDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-16 w-30 flex-col gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
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
            onCancel={() => setIsClientDialogOpen(false)}
            onSubmitSuccess={() => {
              setIsClientDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-16 w-30 flex-col gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            type="create"
            onCancel={() => setIsProjectDialogOpen(false)}
            onSubmitSuccess={() => {
              setIsProjectDialogOpen(false);
              router.push("/dashbord/projects");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
