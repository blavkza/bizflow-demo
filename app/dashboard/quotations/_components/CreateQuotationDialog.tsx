"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuotationForm } from "./QuotationForm";

export function CreateQuotationDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
        </DialogHeader>
        <QuotationForm
          type="create"
          onCancel={() => setIsOpen(false)}
          onSubmitSuccess={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
