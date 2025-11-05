import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface EmptyStateProps {
  hasTools: boolean;
  onAddTool: () => void;
  onClearFilters: () => void;
}

export function EmptyState({
  hasTools,
  onAddTool,
  onClearFilters,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tools found</h3>
        <p className="text-muted-foreground text-center mb-4">
          {hasTools
            ? "No tools match your current filters. Try adjusting your search criteria."
            : "You haven't added any tools yet. Add your first tool to get started."}
        </p>
        {!hasTools && <Button onClick={onAddTool}>Add Your First Tool</Button>}
        {hasTools && <Button onClick={onClearFilters}>Clear Filters</Button>}
      </CardContent>
    </Card>
  );
}
