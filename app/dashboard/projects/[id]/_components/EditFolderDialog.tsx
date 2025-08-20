import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import FolderForm from "./folder-Form";
import { Folder } from "../type";

interface EditFolderDialogProps {
  folder: Folder;
  fetchProject: () => void;
}

export default function EditFolderDialog({
  folder,
  fetchProject,
}: EditFolderDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsEditDialogOpen(true);
            }}
          >
            Rename
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rename folder ({folder.title})</DialogTitle>
          </DialogHeader>
          <FolderForm
            type="update"
            projectId={folder.id}
            data={folder}
            onCancel={() => setIsEditDialogOpen(false)}
            onSubmitSuccess={() => {
              setIsEditDialogOpen(false);
              fetchProject();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
