import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ToolsHeaderProps {
  onAddTool: () => void;
}

export function ToolsHeader({ onAddTool }: ToolsHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tool Inventory</h2>
        <p className="text-muted-foreground">
          Manage your tool inventory, rentals, and internal usage
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onAddTool}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>
    </div>
  );
}
