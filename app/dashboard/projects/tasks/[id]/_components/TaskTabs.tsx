"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryGalleryTab from "./TimeEntryGalleryTab"; //

import { Task } from "@/types/tasks";
import AttachmentsTab from "./AttachmentsTab";
import TimeTrackingTab from "./TimeTrackingTab";
import CommentsTab from "./CommentsTab";

interface TaskTabsProps {
  task: Task;
  refetch: () => void;
}

export default function TaskTabs({ task, refetch }: TaskTabsProps) {
  const imageCount = task.timeEntries.reduce(
    (acc, entry) => acc + entry.images.length,
    0
  );

  return (
    <Tabs defaultValue="time-tracking" className="w-full">
      <TabsList>
        <TabsTrigger value="time-tracking">Time Logs</TabsTrigger>
        <TabsTrigger value="gallery" className="gap-2">
          Gallery
          {imageCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {imageCount}
            </span>
          )}
        </TabsTrigger>
        {/*         <TabsTrigger value="comments">Comments</TabsTrigger>
         */}{" "}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="time-tracking">
          <TimeTrackingTab task={task} refetch={refetch} />
        </TabsContent>

        <TabsContent value="gallery">
          <TimeEntryGalleryTab task={task} />
        </TabsContent>

        {/*   <TabsContent value="comments">
          <div className="p-4 text-center text-muted-foreground">
            Comments coming soon...
          </div>
        </TabsContent> */}
      </div>
    </Tabs>
  );
}
