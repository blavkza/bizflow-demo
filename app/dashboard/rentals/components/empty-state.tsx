import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No rentals found</h3>
        <p className="text-muted-foreground text-center mb-4">
          No rentals match your current filters. Try adjusting your search
          criteria.
        </p>
        <Button onClick={onClearFilters}>Clear Filters</Button>
      </CardContent>
    </Card>
  );
}
