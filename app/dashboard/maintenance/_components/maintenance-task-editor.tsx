"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateMaintenance } from "../actions";
import { toast } from "sonner";
import { Edit3, Save, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CardTitle } from "@/components/ui/card";

interface MaintenanceTaskEditorProps {
  id: string;
  initialTask: string;
}

export function MaintenanceTaskEditor({
  id,
  initialTask,
}: MaintenanceTaskEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const result = await updateMaintenance(id, { task });
      if (result.success) {
        toast.success("Maintenance scope updated");
        setIsEditing(false);
      } else {
        toast.error("Failed to update scope");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 pt-4">
        <RichTextEditor value={task} onChange={setTask} />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" /> Save Scope
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-2">
        <CardTitle className="text-lg">Task Description</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit3 className="h-3 w-3 mr-2" /> Edit Scope
        </Button>
      </div>
      <div
        className="prose prose-sm dark:prose-invert max-w-none bg-muted/10 p-4 rounded-md border"
        dangerouslySetInnerHTML={{ __html: initialTask }}
      />
    </div>
  );
}
