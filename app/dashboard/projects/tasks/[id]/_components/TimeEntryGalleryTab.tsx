"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task } from "@/types/tasks";

interface TimeEntryGalleryTabProps {
  task: Task;
}

export default function TimeEntryGalleryTab({
  task,
}: TimeEntryGalleryTabProps) {
  // Filter only entries that have images
  const entriesWithImages = task.timeEntries.filter(
    (entry) => entry.images && entry.images.length > 0
  );

  // FIXED: Accepts string | Date to handle API responses correctly
  const formatTimeRange = (
    timeIn: string | Date,
    timeOut: string | Date | null
  ) => {
    const start = format(new Date(timeIn), "HH:mm");
    const end = timeOut ? format(new Date(timeOut), "HH:mm") : "Active";
    return `${start} - ${end}`;
  };

  if (entriesWithImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
        <ImageIcon className="h-10 w-10 mb-4 opacity-20" />
        <p>No proofs uploaded in time entries yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Proof of Work</h3>
        <p className="text-sm text-muted-foreground">
          Showing {entriesWithImages.length} entries with attached screenshots.
        </p>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {entriesWithImages.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={entry.user?.avatar || ""} />
                    <AvatarFallback>
                      {entry.user?.firstName?.[0]}
                      {entry.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {entry.images.length} Image
                        {entry.images.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.date), "MMM d")}
                      </div>

                      {/* FIXED SECTION: Proper nesting and separator */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{Number(entry.hours).toFixed(2)} hrs</span>
                        <span className="text-muted-foreground/50 mx-1">•</span>
                        <span className="font-mono text-xs opacity-80">
                          {formatTimeRange(entry.timeIn, entry.timeOut)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {entry.description && (
                  <p className="text-sm text-muted-foreground mb-4 border-l-2 pl-3 italic">
                    "{entry.description}"
                  </p>
                )}

                {/* Horizontal Scroll for images within the entry */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {entry.images.map((imgUrl, index) => (
                    <Dialog key={`${entry.id}-img-${index}`}>
                      <DialogTrigger asChild>
                        <div className="relative h-32 w-48 flex-shrink-0 cursor-zoom-in rounded-md border bg-muted overflow-hidden hover:opacity-90 transition-opacity">
                          <Image
                            src={imgUrl}
                            alt="Work proof"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black/95 border-none">
                        <div className="relative h-[85vh] w-full flex items-center justify-center">
                          <Image
                            src={imgUrl}
                            alt="Full screen proof"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
