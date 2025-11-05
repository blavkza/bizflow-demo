import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToolForm } from "./ToolForm";

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTool: (data: any) => Promise<void>;
}

export function AddToolDialog({
  open,
  onOpenChange,
  onAddTool,
}: AddToolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Add a new tool to your inventory. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <ToolForm onSubmit={onAddTool} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
