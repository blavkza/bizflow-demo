import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Trash } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  id: string;
  type: string;
  fetchProject: () => void;
}

export default function DeleteDialog({
  id,
  type,
  fetchProject,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (type === "File") {
        await axios.delete(`/api/documents/${id}`);
        toast.success("File deleted successfully");
      } else if (type == "Folder") {
        await axios.delete(`/api/folders/${id}`);
        toast.success("Folder deleted successfully");
      } else if (type == "Project") {
        await axios.delete(`/api/projects/${id}`);
        toast.success("Project deleted successfully");
      } else if (type === "Task") {
        await axios.delete(`/api/tasks/${id}`);
        toast.success("Task deleted successfully");
      } else {
        await axios.delete(`/api/subtasks/${id}`);
        toast.success("Subtask deleted successfully");
      }

      fetchProject();
      setIsOpen(false);
    } catch (error) {
      toast.error(`Failed to delete the Item`);
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {type === "Project" ? (
          <Button
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
            variant="outline"
            size="sm"
            className=" text-red-500 cursor-pointer"
          >
            <Trash className="w-4 h-4 mr-1" />
          </Button>
        ) : type === "Task" ? (
          <Button
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
            variant="outline"
            size="sm"
            className="cursor-pointer text-red-500"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            Delete
          </DropdownMenuItem>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this{" "}
            {type}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={handleDelete}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              `Delete ${type}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
