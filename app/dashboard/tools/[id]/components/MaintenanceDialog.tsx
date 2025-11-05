import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaintenanceForm } from "../../components/MaintenanceForm";
import { Tool } from "@/types/tool";

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool;
  onSubmit: (data: any) => Promise<void>;
}

export function MaintenanceDialog({
  open,
  onOpenChange,
  tool,
  onSubmit,
}: MaintenanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogDescription>
            Record maintenance or repair work for this tool.
          </DialogDescription>
        </DialogHeader>
        <MaintenanceForm
          toolId={tool.id}
          toolName={tool.name}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
