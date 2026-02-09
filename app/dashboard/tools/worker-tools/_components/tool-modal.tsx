"use client";

import { ToolForm } from "../../_components/ToolForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tool } from "@/types/tool";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Tool>;
}

export const ToolModal = ({ isOpen, onClose, initialData }: ToolModalProps) => {
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    try {
      if (initialData) {
        await axios.patch(`/api/worker-tools/${initialData.id}`, values);
      } else {
        await axios.post("/api/worker-tools", values);
      }
      router.refresh();
      onClose();
      // Toast is handled by ToolForm, but we can add refresh logic here
      // ToolForm calls toast.success, so we don't need to duplicate
    } catch (error) {
      console.error(error);
      throw error; // Let ToolForm handle error display
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tool" : "Add Tool"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update tool details."
              : "Add a new tool to the inventory."}
          </DialogDescription>
        </DialogHeader>
        <ToolForm
          tool={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
