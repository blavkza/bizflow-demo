import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project, Tool } from "../type";
import {
  Plus,
  Wrench,
  Calendar,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
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

interface ProjectToolsProps {
  project: Project;
  fetchProject: () => void;
}

export function ProjectTools({ project, fetchProject }: ProjectToolsProps) {
  const toolInterUses = project.toolInterUses || [];
  const assignedTools = project.tools || [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      // Filter out subtools (tools that have a parentToolId)
      const mainTools = tools.filter((t) => !t.parentToolId);
      setAllTools(mainTools);
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
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Assign Tools to Project</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select from main tools only. Subtools are automatically included
                with their parents.
              </p>
            </DialogHeader>
            <div className="py-4 space-y-4 flex-1 overflow-auto">
              <div className="flex items-center gap-2">
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search tools by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {isLoadingTools ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {allTools
                    .filter(
                      (tool) =>
                        tool.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        tool.code
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((tool) => {
                      const isSelected = selectedToolIds.includes(tool.id);
                      return (
                        <Card
                          key={tool.id}
                          className={`cursor-pointer transition-all hover:border-primary border-2 ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedToolIds(
                                selectedToolIds.filter((id) => id !== tool.id),
                              );
                            } else {
                              setSelectedToolIds([...selectedToolIds, tool.id]);
                            }
                          }}
                        >
                          <CardContent className="p-3 flex items-center gap-4">
                            <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-muted">
                              {tool.primaryImage ? (
                                <Image
                                  src={tool.primaryImage}
                                  alt={tool.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Wrench className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium truncate">
                                {tool.name}
                              </h5>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {tool.code || "No Code"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className={`text-[9px] px-1 py-0 h-4 ${
                                    tool.status === "AVAILABLE"
                                      ? "bg-green-100 text-green-700"
                                      : tool.status === "IN_USE"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {tool.status}
                                </Badge>
                                <span
                                  className={`text-[9px] font-medium ${getConditionColor(tool.condition)}`}
                                >
                                  {tool.condition}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <div className="flex flex-col sm:flex-row justify-between w-full items-center gap-4">
                <p className="text-sm font-medium">
                  {selectedToolIds.length} Tools Selected
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none"
                    onClick={handleUpdateTools}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Assignment
                  </Button>
                </div>
              </div>
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
