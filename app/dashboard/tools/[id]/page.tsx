"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tool } from "@/types/tool";
import { toast } from "sonner";
import { ToolDetailView } from "./components/ToolDetailView";

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadTool();
    }
  }, [params.id]);

  const loadTool = async () => {
    try {
      const response = await fetch(`/api/tools/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTool(data);
      } else {
        throw new Error("Failed to load tool");
      }
    } catch (error) {
      toast.error("Failed to load tool");
      console.error("Error loading tool:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTool = async (data: any): Promise<void> => {
    try {
      const response = await fetch(`/api/tools/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadTool();
      } else {
        throw new Error("Failed to update tool");
      }
    } catch (error) {
      toast.error("Failed to update tool");
      throw error;
    }
  };

  const handleDeleteTool = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/tools/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tool deleted successfully");
        router.push("/dashboard/tools");
      } else {
        throw new Error("Failed to delete tool");
      }
    } catch (error) {
      toast.error("Failed to delete tool");
      throw error;
    }
  };

  const handleAddMaintenance = async (data: any): Promise<void> => {
    try {
      const response = await fetch(`/api/tools/${params.id}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadTool();
      } else {
        throw new Error("Failed to add maintenance record");
      }
    } catch (error) {
      toast.error("Failed to add maintenance record");
      throw error;
    }
  };

  const handleAddInterUse = async (data: any): Promise<void> => {
    try {
      const response = await fetch(`/api/tools/${params.id}/interuse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadTool();
      } else {
        throw new Error("Failed to add internal use record");
      }
    } catch (error) {
      toast.error("Failed to add internal use record");
      throw error;
    }
  };

  return (
    <ToolDetailView
      tool={tool}
      loading={loading}
      onUpdateTool={handleUpdateTool}
      onDeleteTool={handleDeleteTool}
      onAddMaintenance={handleAddMaintenance}
      onAddInterUse={handleAddInterUse}
      loadTool={loadTool}
    />
  );
}
