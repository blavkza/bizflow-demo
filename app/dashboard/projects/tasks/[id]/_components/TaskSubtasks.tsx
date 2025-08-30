"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { Task, formatStatus, getStatusColor } from "@/types/tasks";
import { TaskStatus } from "@prisma/client";
import SubtaskForm from "./SubtaskForm";
import DeleteDialog from "../../../[id]/_components/DeleteDialog";

interface TaskSubtasksProps {
  task: Task;
  refetch: () => void;
}

export default function TaskSubtasks({ task, refetch }: TaskSubtasksProps) {
  const [subtasks, setSubtasks] = useState(task.Subtask || []);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<any>(null);

  const toggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find((st) => st.id === subtaskId);
    if (!subtask) return;

    const originalSubtasks = [...subtasks];
    const newStatus =
      subtask.status === TaskStatus.COMPLETED
        ? TaskStatus.TODO
        : TaskStatus.COMPLETED;

    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, status: newStatus } : st
      )
    );

    setUpdatingId(subtaskId);

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subtask");
      }

      const updatedSubtask = await response.json();
      setSubtasks((prev) =>
        prev.map((st) => (st.id === subtaskId ? updatedSubtask : st))
      );
      refetch();
    } catch (error) {
      console.error("Error updating subtask:", error);
      setSubtasks(originalSubtasks);
      alert("Failed to update subtask. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditSubtask = (subtask: any) => {
    setEditingSubtask(subtask);
    setIsEditDialogOpen(true);
  };

  const handleSubtaskSuccess = () => {
    fetch(`/api/tasks/${task.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.Subtask) {
          setSubtasks(data.Subtask);
        }
      })
      .catch(console.error);
  };

  const completedSubtasks = subtasks.filter(
    (st) => st.status === TaskStatus.COMPLETED
  ).length;
  const progressPercentage =
    subtasks.length > 0
      ? Math.round((completedSubtasks / subtasks.length) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Subtasks</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>
                {completedSubtasks} of {subtasks.length} completed
              </span>
              <span>•</span>
              <span>{progressPercentage}% done</span>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={"outline"} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Subtask
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Subtask</DialogTitle>
                <DialogDescription>
                  Create a new subtask to break down this task into smaller
                  pieces.
                </DialogDescription>
              </DialogHeader>
              <SubtaskForm
                type="create"
                taskId={task.id}
                onCancel={() => setIsAddDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsAddDialogOpen(false);
                  handleSubtaskSuccess();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <div className="space-y-3">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={subtask.status === TaskStatus.COMPLETED}
                onCheckedChange={() => toggleSubtask(subtask.id)}
                disabled={
                  updatingId === subtask.id || deletingId === subtask.id
                }
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      subtask.status === TaskStatus.COMPLETED
                        ? "line-through text-muted-foreground"
                        : ""
                    } ${updatingId === subtask.id ? "opacity-50" : ""}`}
                  >
                    {subtask.title}
                    {updatingId === subtask.id && " (Updating...)"}
                    {deletingId === subtask.id && " (Deleting...)"}
                  </span>
                  <div className="flex items-center space-x-2">
                    {subtask.estimatedHours && (
                      <Badge variant="outline" className="text-xs">
                        {subtask.estimatedHours}h
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(task.status)}`}
                    >
                      {formatStatus(subtask.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={deletingId === subtask.id}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditSubtask(subtask)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DeleteDialog
                          id={subtask.id}
                          type="SubTask"
                          fetchProject={handleSubtaskSuccess}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {subtask.description && (
                  <p className="text-xs text-muted-foreground">
                    {subtask.description}
                  </p>
                )}
              </div>
            </div>
          ))}
          {subtasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No subtasks yet</p>
              <p className="text-sm">Add subtasks to break down this task</p>
            </div>
          )}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Subtask</DialogTitle>
              <DialogDescription>
                Update the subtask details below.
              </DialogDescription>
            </DialogHeader>
            <SubtaskForm
              type="update"
              taskId={task.id}
              data={editingSubtask}
              onCancel={() => setIsEditDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsEditDialogOpen(false);
                handleSubtaskSuccess();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
