import { Card, CardContent } from "@/components/ui/card";
import { Tool } from "@/types/tool";
import { ToolCard } from "./ToolCard";

interface ToolsListProps {
  tools: Tool[];
  onDeleteTool: (toolId: string) => void;
}

export function ToolsList({ tools, onDeleteTool }: ToolsListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onDeleteTool={onDeleteTool}
              view="list"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
