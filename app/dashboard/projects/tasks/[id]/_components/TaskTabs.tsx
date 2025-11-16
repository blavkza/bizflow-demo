"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Task } from "@/types/tasks";
import AttachmentsTab from "./AttachmentsTab";
import TimeTrackingTab from "./TimeTrackingTab";
import CommentsTab from "./CommentsTab";

interface TaskTabsProps {
  task: Task;
  refetch: () => void;
}

export default function TaskTabs({ task, refetch }: TaskTabsProps) {
  return <TimeTrackingTab task={task} refetch={refetch} />;
}
