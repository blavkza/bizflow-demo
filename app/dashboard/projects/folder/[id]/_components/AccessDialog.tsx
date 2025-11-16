import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
  avatar: string;
}

interface AccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessDialog({ isOpen, onClose }: AccessDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "editor",
      avatar: "JD",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "viewer",
      avatar: "JS",
    },
  ]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  const addCollaborator = () => {
    if (
      newCollaboratorEmail.trim() &&
      !collaborators.find((c) => c.email === newCollaboratorEmail)
    ) {
      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        name: newCollaboratorEmail.split("@")[0],
        email: newCollaboratorEmail,
        role: "viewer",
        avatar: newCollaboratorEmail.substring(0, 2).toUpperCase(),
      };
      setCollaborators((prev) => [...prev, newCollaborator]);
      setNewCollaboratorEmail("");
    }
  };

  const removeCollaborator = (collaboratorId: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
  };

  const updateCollaboratorRole = (
    collaboratorId: string,
    newRole: "viewer" | "editor"
  ) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === collaboratorId ? { ...c, role: newRole } : c))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Folder Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Add Collaborator */}
          <div className="space-y-2">
            <Label>Add Collaborator</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address..."
                value={newCollaboratorEmail}
                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCollaborator()}
              />
              <Button
                onClick={addCollaborator}
                disabled={!newCollaboratorEmail.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Current Collaborators */}
          <div className="space-y-3">
            <Label>Current Access ({collaborators.length} people)</Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {collaborator.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{collaborator.name}</p>
                      <p className="text-xs text-gray-500">
                        {collaborator.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={collaborator.role}
                      onValueChange={(value: "viewer" | "editor") =>
                        updateCollaboratorRole(collaborator.id, value)
                      }
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaborator(collaborator.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onClose}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
