"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash, Edit, Package } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface ToolHeaderProps {
  tool: any;
  onAllocate: () => void;
  onEdit: () => void;
}

export function ToolHeader({ tool, onAllocate, onEdit }: ToolHeaderProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/api/worker-tools/${tool.id}`);
      toast.success("Tool deleted successfully");
      router.push("/dashboard/tools/worker-tools");
    } catch (error) {
      toast.error("Failed to delete tool");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/tools/worker-tools")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tool.serialNumber || "No Serial"}</span>
            <span>•</span>
            <Badge variant={tool.quantity > 0 ? "default" : "destructive"}>
              {tool.quantity > 0 ? "In Stock" : "Out of Stock"}
            </Badge>
            {tool.condition && (
              <Badge variant="outline">{tool.condition}</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAllocate}
          disabled={tool.quantity <= 0}
        >
          <Package className="mr-2 h-4 w-4" />
          Allocate
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                tool from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
