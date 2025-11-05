import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tool } from "@/types/tool";

interface ToolDetailsProps {
  tool: Tool;
}

export function ToolDetails({ tool }: ToolDetailsProps) {
  const canBeRented =
    tool.canBeRented !== false &&
    tool.rentalRateDaily !== null &&
    tool.rentalRateDaily !== undefined &&
    Number(tool.rentalRateDaily) > 0;

  const renderFormattedText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
  };

  const hasHTMLTags = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "";

    if (hasHTMLTags(description)) {
      return renderFormattedText(description);
    }

    return description.replace(/\n/g, "<br>");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-sm font-medium">{tool.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <div
                className="prose prose-sm max-w-none text-muted-foreground "
                dangerouslySetInnerHTML={{
                  __html: getDescriptionHTML(tool.description || ""),
                }}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Purchase Date
              </label>
              <p className="text-sm font-medium">
                {tool.purchaseDate
                  ? new Date(tool.purchaseDate).toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created By
              </label>
              <p className="text-sm font-medium">{tool.createdBy}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-sm font-medium">
                {new Date(tool.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="text-sm font-medium">
                {new Date(tool.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <p className="text-sm font-medium">
                {tool.category || "Uncategorized"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Rental Availability
              </label>
              <p className="text-sm font-medium">
                {canBeRented ? "Available for Rental" : "Not for Rental"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
