import { Tool } from "@/types/tool";
import { ToolCard } from "./ToolCard";

interface ToolsGridProps {
  tools: Tool[];
  onDeleteTool: (toolId: string) => void;
}

export function ToolsGrid({ tools, onDeleteTool }: ToolsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onDeleteTool={onDeleteTool}
          view="grid"
        />
      ))}
    </div>
  );
}
