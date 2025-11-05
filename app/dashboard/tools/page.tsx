"use client";

import { useState, useEffect } from "react";
import { Tool } from "@/types/tool";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "./components/LoadingState";
import { ToolsHeader } from "./components/ToolsHeader";
import { ToolsSummary } from "./components/ToolsSummary";
import { ToolsFilters } from "./components/ToolsFilters";
import { ToolsGrid } from "./components/ToolsGrid";
import { ToolsList } from "./components/ToolsList";
import { EmptyState } from "./components/EmptyState";
import { AddToolDialog } from "./components/AddToolDialog";

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await fetch("/api/tools");
      if (response.ok) {
        const data = await response.json();
        setTools(data);
      } else {
        throw new Error("Failed to load tools");
      }
    } catch (error) {
      toast.error("Failed to load tools");
      console.error("Error loading tools:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = async (data: any) => {
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadTools();
        setIsAddDialogOpen(false);
      } else {
        throw new Error("Failed to create tool");
      }
    } catch (error) {
      toast.error("Failed to create tool");
      throw error;
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;

    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadTools();
        toast.success("Tool deleted successfully");
      } else {
        throw new Error("Failed to delete tool");
      }
    } catch (error) {
      toast.error("Failed to delete tool");
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      tool.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "All Status" ||
      tool.status === selectedStatus.toUpperCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ToolsHeader onAddTool={() => setIsAddDialogOpen(true)} />

      <ToolsSummary tools={tools} />

      <ToolsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <ToolsGrid tools={filteredTools} onDeleteTool={handleDeleteTool} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ToolsList tools={filteredTools} onDeleteTool={handleDeleteTool} />
        </TabsContent>
      </Tabs>

      {filteredTools.length === 0 && (
        <EmptyState
          hasTools={tools.length > 0}
          onAddTool={() => setIsAddDialogOpen(true)}
          onClearFilters={() => {
            setSearchTerm("");
            setSelectedCategory("All Categories");
            setSelectedStatus("All Status");
          }}
        />
      )}

      <AddToolDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTool={handleAddTool}
      />
    </div>
  );
}
