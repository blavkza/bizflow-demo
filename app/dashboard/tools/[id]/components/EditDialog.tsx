import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToolForm } from "../../components/ToolForm";
import { Tool } from "@/types/tool";

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool;
  onSubmit: (data: any) => Promise<void>;
}

export function EditDialog({
  open,
  onOpenChange,
  tool,
  onSubmit,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>Update the tool details below.</DialogDescription>
        </DialogHeader>
        <ToolForm
          tool={tool}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
