"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolRentalDetail } from "../types";

interface NotesCardProps {
  rental: ToolRentalDetail;
  onRentalUpdated: () => void;
}

export default function NotesCard({ rental, onRentalUpdated }: NotesCardProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [notes, setNotes] = useState(rental.notes || "");
  const [updating, setUpdating] = useState(false);

  const handleSave = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rental.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast.success("Notes updated successfully");
        setIsNoteDialogOpen(false);
        onRentalUpdated();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Error updating notes");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Notes</CardTitle>
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Notes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Rental Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this rental"
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNoteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {rental.notes || "No notes added for this rental."}
        </p>
      </CardContent>
    </Card>
  );
}
