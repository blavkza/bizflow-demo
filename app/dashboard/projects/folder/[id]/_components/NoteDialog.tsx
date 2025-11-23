import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { Note, NoteColor } from "./types";
import { useState, useEffect } from "react";
import { Editor } from "@/components/ui/editor";

interface NoteDialogProps {
  note: Note | null;
  onClose: () => void;
  onSave: (note: Note) => void;
}

const colorClasses: Record<NoteColor, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export default function NoteDialog({ note, onClose, onSave }: NoteDialogProps) {
  const [editedNote, setEditedNote] = useState<Note | null>(null);
  const [tagsString, setTagsString] = useState("");

  useEffect(() => {
    if (note) {
      setEditedNote(note);
      setTagsString(note.tags.join(", "));
    }
  }, [note]);

  const handleSave = () => {
    if (editedNote) {
      const finalTags = tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      onSave({ ...editedNote, tags: finalTags });
    }
  };

  if (!editedNote) return null;

  return (
    <Dialog open={!!note} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editedNote.title}
              onChange={(e) =>
                setEditedNote((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="edit-tags">Tags (comma separated)</Label>
            <Input
              id="edit-tags"
              value={tagsString}
              onChange={(e) => {
                setTagsString(e.target.value);
                setEditedNote((prev) =>
                  prev
                    ? {
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }
                    : null
                );
              }}
            />
          </div>
          <div>
            <Label htmlFor="edit-content">Content</Label>
            <Editor
              placeholder="Enter note content..."
              value={editedNote.content}
              onChange={(value: string) =>
                setEditedNote((prev) =>
                  prev ? { ...prev, content: value } : null
                )
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Color:</Label>
              <div className="flex gap-2">
                {(
                  ["blue", "green", "yellow", "purple", "pink"] as NoteColor[]
                ).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setEditedNote((prev) =>
                        prev ? { ...prev, color } : null
                      )
                    }
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      editedNote.color === color
                        ? "border-gray-800 scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    } ${colorClasses[color]}`}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
