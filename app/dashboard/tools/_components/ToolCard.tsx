import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ban } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Tool } from "@/types/tool";
import { formatCurrency, formatCount } from "../utils";
import { getStatusColor, getConditionColor, getCategoryColors } from "../utils";

interface ToolCardProps {
  tool: Tool;
  onDeleteTool: (toolId: string) => void;
  view: "grid" | "list";
}

export function ToolCard({ tool, onDeleteTool, view }: ToolCardProps) {
  const colors = getCategoryColors(tool.category);
  const isRentable = canToolBeRented(tool);

  if (view === "grid") {
    return (
      <Card className="hover:shadow-lg transition-all group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(tool.status)}>
                {tool.status.charAt(0) + tool.status.slice(1).toLowerCase()}
              </Badge>

              {!isRentable && (
                <Badge
                  variant="outline"
                  className="bg-gray-100 flex items-center gap-1"
                >
                  <Ban className="h-3 w-3" />
                  Not for Rent
                </Badge>
              )}
            </div>
          </div>

          <h3 className="mt-4 truncate text-xl font-semibold">{tool.name}</h3>
        </CardHeader>

        <CardContent className="space-y-4 mt-2">
          {tool.primaryImage && (
            <div className="aspect-video bg-transparent rounded-lg overflow-hidden">
              <Image
                src={tool.primaryImage}
                alt={tool.name || "Tool image"}
                width={800}
                height={450}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category:</span>
            <Badge variant="outline">{tool.category || "Uncategorized"}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Condition:</span>
              <Badge
                variant="outline"
                className={getConditionColor(tool.condition)}
              >
                {tool.condition?.toLowerCase() || "unknown"}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Rate:</span>
              <span className="font-medium">
                {isRentable
                  ? formatCurrency(tool.rentalRateDaily)
                  : "Not for rent"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-2">Usage Stats:</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {formatCount(tool.rentals?.length)} rentals
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatCount(tool.InterUse?.length)} internal uses
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatCount(tool.maintenanceLogs?.length)} maintenance
              </Badge>
            </div>
          </div>

          <Button asChild className="w-full mt-4">
            <Link href={`/dashboard/tools/${tool.id}`}>View Details</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <div className="p-6 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {tool.primaryImage && (
            <Image
              src={tool.primaryImage}
              alt={tool.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{tool.name}</h3>
            <Badge className={getStatusColor(tool.status)}>
              {tool.status.charAt(0) + tool.status.slice(1).toLowerCase()}
            </Badge>
            {!isRentable && (
              <Badge variant="outline" className="bg-gray-100">
                <Ban className="h-3 w-3 mr-1" />
                Not for Rent
              </Badge>
            )}
            <Badge variant="outline">{tool.category || "Uncategorized"}</Badge>
            <Badge
              variant="outline"
              className={getConditionColor(tool.condition)}
            >
              {tool.condition.toLowerCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <span className="text-muted-foreground">Purchase Price:</span>{" "}
              <span className="font-medium">
                {formatCurrency(tool.purchasePrice)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Daily Rate:</span>{" "}
              <span className="font-medium">
                {isRentable
                  ? formatCurrency(tool.rentalRateDaily)
                  : "Not for rent"}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Rentals:</span>{" "}
              <span className="font-medium">
                {formatCount(tool.rentals?.length)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Internal Uses:</span>{" "}
              <span className="font-medium">
                {formatCount(tool.InterUse?.length)}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/dashboard/tools/${tool.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function canToolBeRented(tool: Tool): boolean {
  return (
    tool.canBeRented !== false &&
    tool.rentalRateDaily !== null &&
    tool.rentalRateDaily !== undefined
  );
}
