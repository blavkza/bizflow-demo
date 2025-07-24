import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  status: string;
  createdAt: Date;
  lastLogin: Date | null;
}

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export default function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onDeleteSuccess,
}: DeleteUserDialogProps) {
  const router = useRouter();
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    if (confirmationInput !== user.userName) {
      toast.error("Username does not match");
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(`/api/users/${user.id}`);
      toast.success("User deleted successfully");
      onDeleteSuccess();
      setConfirmationInput("");
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            To delete {user.name}'s account, please type their username{" "}
            <strong>{user.userName}</strong> below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <Input
            placeholder={`Type "${user.userName}" to confirm`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmationInput !== user.userName || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
