import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterUseForm } from "../../components/InterUseForm";
import { Tool } from "@/types/tool";

interface InterUseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool;
  onSubmit: (data: any) => Promise<void>;
}

export function InterUseDialog({
  open,
  onOpenChange,
  tool,
  onSubmit,
}: InterUseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Internal Use Record</DialogTitle>
          <DialogDescription>
            Record internal business use of this tool.
          </DialogDescription>
        </DialogHeader>
        <InterUseForm
          toolId={tool.id}
          toolName={tool.name}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
