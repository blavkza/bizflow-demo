"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Lock } from "lucide-react";
import { Note, NoteColor } from "./types";
import NoteCard from "./NoteCard";
import NoteDialog from "./NoteDialog";
import { toast } from "sonner";
import { Editor } from "@/components/ui/editor";

interface NotesTabProps {
  notes: Note[];
  folderId: string;
  onNotesUpdate: () => void;
  canEditNotes?: boolean;
}

interface NewNoteState {
  title: string;
  content: string;
  tags: string;
  color: NoteColor;
}

export default function NotesTab({
  notes = [],
  folderId,
  onNotesUpdate,
  canEditNotes = false,
}: NotesTabProps) {
  const [newNote, setNewNote] = useState<NewNoteState>({
    title: "",
    content: "",
    tags: "",
    color: "blue",
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const addNote = async () => {
    if (!canEditNotes) {
      toast.error("You don't have permission to create notes");
      return;
    }

    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const response = await fetch(`/api/folders/${folderId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          tags: newNote.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          color: newNote.color,
          pinned: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      await response.json();
      onNotesUpdate();
      setNewNote({ title: "", content: "", tags: "", color: "blue" });
      toast.success("Note created successfully");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  const updateNote = async (updatedNote: Note) => {
    if (!canEditNotes) {
      toast.error("You don't have permission to edit notes");
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: updatedNote.id,
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags,
          color: updatedNote.color,
          pinned: updatedNote.pinned,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      await response.json();
      onNotesUpdate();
      setEditingNote(null);
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!canEditNotes) {
      toast.error("You don't have permission to delete notes");
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}/notes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      onNotesUpdate();
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const toggleNotePinned = async (noteId: string) => {
    if (!canEditNotes) {
      toast.error("You don't have permission to modify notes");
      return;
    }

    try {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const response = await fetch(`/api/folders/${folderId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          pinned: !note.pinned,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      onNotesUpdate();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const colorClasses: Record<NoteColor, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };

  return (
    <div className="space-y-6">
      {/* Add Note Card - Conditionally rendered based on permissions */}
      {canEditNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  placeholder="Enter note title..."
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="note-tags">Tags (comma separated)</Label>
                <Input
                  id="note-tags"
                  placeholder="planning, important, review..."
                  value={newNote.tags}
                  onChange={(e) =>
                    setNewNote((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="note-content">Content</Label>
              <Editor
                placeholder="Enter note content..."
                value={newNote.content}
                // FIX: Handled value directly instead of event object
                onChange={(value: string) =>
                  setNewNote((prev) => ({
                    ...prev,
                    content: value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Color:</Label>
                <div className="flex gap-2">
                  {(
                    ["blue", "green", "yellow", "purple", "pink"] as NoteColor[]
                  ).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewNote((prev) => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newNote.color === color
                          ? "border-gray-800 scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      } ${colorClasses[color]}`}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={addNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View-only message for users without edit permissions */}
      {!canEditNotes && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">
                View only - You don't have permission to create or edit notes
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Display */}
      <div className="grid gap-6">
        {sortedNotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {canEditNotes
                  ? "No notes yet. Create your first note above!"
                  : "No notes in this folder."}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={setEditingNote}
              onDelete={deleteNote}
              onTogglePinned={toggleNotePinned}
              canEditNotes={canEditNotes}
            />
          ))
        )}
      </div>

      {/* Edit Note Dialog */}
      <NoteDialog
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSave={updateNote}
      />
    </div>
  );
}
