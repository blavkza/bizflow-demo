import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project, Tool } from "../type";
import { Plus, Wrench, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";

interface ProjectToolsProps {
  project: Project;
  fetchProject: () => void;
}

export function ProjectTools({ project, fetchProject }: ProjectToolsProps) {
  const toolInterUses = project.toolInterUses || [];
  const assignedTools = project.tools || [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allTools, setAllTools] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      fetchTools();
    }
  }, [isDialogOpen]);

  useEffect(() => {
    setSelectedToolIds(assignedTools.map((t) => t.id));
  }, [project.tools]);

  const fetchTools = async () => {
    setIsLoadingTools(true);
    try {
      const response = await axios.get("/api/tools");
      const tools: Tool[] = response.data || [];
      setAllTools(tools.map((t) => ({ label: t.name, value: t.id })));
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Failed to load tools");
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleUpdateTools = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(`/api/projects/${project.id}`, {
        toolIds: selectedToolIds,
      });
      toast.success("Project tools updated successfully");
      fetchProject();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating tools:", error);
      toast.error("Failed to update project tools");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getDescriptionHTML = (description: string) => {
    if (!description) return "";
    return description.replace(/\n/g, "<br>");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Tools</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track tools assigned to this project
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Manage Tools
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Tools to Project</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {isLoadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <MultiSelect
                  options={allTools}
                  selected={selectedToolIds}
                  onChange={setSelectedToolIds}
                  placeholder="Select tools..."
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTools} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assigned Tools Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium flex items-center gap-2">
          <Wrench size={18} className="text-primary" />
          Assigned Tools ({assignedTools.length})
        </h4>
        {assignedTools.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Wrench className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">
                No tools assigned yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTools.map((tool) => (
              <Card key={tool.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex h-24">
                    <div className="w-24 bg-muted flex items-center justify-center shrink-0">
                      {tool.primaryImage ? (
                        <Image
                          src={tool.primaryImage}
                          alt={tool.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Wrench className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-3 flex flex-col justify-between min-w-0 flex-1">
                      <div>
                        <h5 className="font-semibold text-sm truncate">
                          {tool.name}
                        </h5>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                          {tool.category || "No Category"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getConditionColor(tool.condition)}`}
                        >
                          {tool.condition}
                        </Badge>
                        <Link href={`/dashboard/tools/${tool.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Usage History Section */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-md font-medium flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          Usage Logs ({toolInterUses.length})
        </h4>
        {toolInterUses.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No usage history recorded for this project.
          </p>
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
                            src={
                              toolUse.tool.primaryImage || "/placeholder.png"
                            }
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
                            className={getConditionColor(
                              toolUse.tool.condition,
                            )}
                          >
                            {toolUse.tool.condition}
                          </Badge>
                        </div>

                        {toolUse.tool.description && (
                          <div
                            className="prose prose-sm max-w-none text-muted-foreground line-clamp-3 "
                            dangerouslySetInnerHTML={{
                              __html: getDescriptionHTML(
                                toolUse.tool.description || "",
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
                                "MMM d, yyyy",
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(toolUse.useEndDate),
                                "MMM d, yyyy",
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
    </div>
  );
}
