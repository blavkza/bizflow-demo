import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project, ToolInterUse } from "../type";
import { Plus, Wrench, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface ProjectToolsProps {
  project: Project;
  fetchProject: () => void;
}

export function ProjectTools({ project, fetchProject }: ProjectToolsProps) {
  const toolInterUses = project.toolInterUses || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-emerald-100 text-emerald-800";
      case "GOOD":
        return "bg-green-100 text-green-800";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "POOR":
        return "bg-orange-100 text-orange-800";
      case "BROKEN":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tools in Use</h3>
        {/*  <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tool
        </Button> */}
      </div>

      {toolInterUses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tools are currently assigned to this project.
            </p>
            {/*  <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Assign Tool
            </Button> */}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {toolInterUses.map((toolUse) => (
            <Card
              key={toolUse.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {toolUse.tool.primaryImage ? (
                      <div className="h-20 w-20 flex items-center justify-center bg-transparent rounded-lg overflow-hidden">
                        <Image
                          src={toolUse.tool.primaryImage || "/placeholder.png"}
                          alt={toolUse.tool.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                        <Wrench className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{toolUse.tool.name}</h4>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(toolUse.status)}
                        >
                          {toolUse.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getConditionColor(toolUse.tool.condition)}
                        >
                          {toolUse.tool.condition}
                        </Badge>
                      </div>

                      {toolUse.tool.description && (
                        <div
                          className="prose prose-sm max-w-none text-muted-foreground line-clamp-3 "
                          dangerouslySetInnerHTML={{
                            __html: getDescriptionHTML(
                              toolUse.tool.description || ""
                            ),
                          }}
                        />
                      )}

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(toolUse.useStartDate),
                              "MMM d, yyyy"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(toolUse.useEndDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>

                        {toolUse.damageReported && (
                          <div className="flex items-center space-x-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Damage Reported</span>
                          </div>
                        )}
                      </div>

                      {toolUse.notes && (
                        <p className="text-sm bg-muted/50 p-2 rounded">
                          <strong>Notes:</strong> {toolUse.notes}
                        </p>
                      )}

                      {toolUse.damageDescription && (
                        <p className="text-sm bg-amber-50 text-amber-800 p-2 rounded">
                          <strong>Damage Description:</strong>{" "}
                          {toolUse.damageDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Released by: {toolUse.relisedBy}
                    </div>
                    <Link
                      href={`/dashboard/tools/${toolUse.toolId}`}
                      className=""
                    >
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
