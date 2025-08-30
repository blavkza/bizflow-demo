"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Task } from "@/types/tasks";
import AttachmentsTab from "./AttachmentsTab";
import TimeTrackingTab from "./TimeTrackingTab";
import CommentsTab from "./CommentsTab";

interface TaskTabsProps {
  task: Task;
}

export default function TaskTabs({ task }: TaskTabsProps) {
  return (
    <Tabs defaultValue="comments" className="space-y-4">
      <TabsList>
        <TabsTrigger value="comments">
          Comments ({task.comment.length})
        </TabsTrigger>
        <TabsTrigger value="attachments">
          Attachments ({task.documents.length})
        </TabsTrigger>
        <TabsTrigger value="time">Time Tracking</TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="space-y-4">
        <CommentsTab task={task} />
      </TabsContent>

      <TabsContent value="attachments" className="space-y-4">
        <AttachmentsTab task={task} />
      </TabsContent>

      <TabsContent value="time" className="space-y-4">
        <TimeTrackingTab task={task} />
      </TabsContent>
    </Tabs>
  );
}
