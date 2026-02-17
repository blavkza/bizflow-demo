"use client";

import { useState, useEffect } from "react";
import { User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tool, ToolCheck } from "./_components/types";
import { WorkerToolsTab } from "./_components/worker-tools-tab";
import { CheckHistoryTab } from "./_components/check-history-tab";
import { CheckToolDialog } from "./_components/check-tool-dialog";

export default function ToolChecksPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [checkHistory, setCheckHistory] = useState<ToolCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"workers" | "history">("workers");

  const fetchPendingTools = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tool-checks/pending");
      if (!response.ok) throw new Error("Failed to fetch tools");
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast.error("Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckHistory = async () => {
    try {
      const response = await fetch("/api/tool-checks");
      if (!response.ok) throw new Error("Failed to fetch check history");
      const data = await response.json();
      setCheckHistory(data);
    } catch (error) {
      console.error("Error fetching check history:", error);
    }
  };

  useEffect(() => {
    fetchPendingTools();
    fetchCheckHistory();
  }, []);

  const handleOpenCheckDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setCheckDialogOpen(true);
  };

  const handleCheckSuccess = () => {
    fetchPendingTools();
    fetchCheckHistory();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Weekly Tool Checks</h1>
          <p className="text-muted-foreground">
            Conduct weekly inspections of allocated tools by worker
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "workers" ? "default" : "ghost"}
          onClick={() => setActiveTab("workers")}
          className="rounded-b-none"
        >
          <User className="h-4 w-4 mr-2" />
          Workers & Tools
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          onClick={() => setActiveTab("history")}
          className="rounded-b-none"
        >
          <Clock className="h-4 w-4 mr-2" />
          Check History ({checkHistory.length})
        </Button>
      </div>

      {/* Workers Tab */}
      {activeTab === "workers" && (
        <WorkerToolsTab
          tools={tools}
          loading={loading}
          onCheckTool={handleOpenCheckDialog}
        />
      )}

      {/* Check History Tab */}
      {activeTab === "history" && (
        <CheckHistoryTab checkHistory={checkHistory} />
      )}

      {/* Check Dialog */}
      <CheckToolDialog
        tool={selectedTool}
        isOpen={checkDialogOpen}
        onClose={() => setCheckDialogOpen(false)}
        onSuccess={handleCheckSuccess}
      />
    </div>
  );
}
