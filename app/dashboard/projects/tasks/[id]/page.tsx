"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Task } from "@/types/tasks";
import LoadingSpinner from "./_components/Loading";
import ErrorDisplay from "./_components/ErrorDisplay";
import TaskDetailHeader from "./_components/TaskDetailHeader";
import TaskDescription from "./_components/TaskDescription";
import TaskSubtasks from "./_components/TaskSubtasks";
import TaskTabs from "./_components/TaskTabs";
import TaskSidebar from "./_components/TaskSidebar";
import Loading from "./_components/Loading";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  console.log(task);

  const fetchTask = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/tasks/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const taskData = await response.json();
      console.log("task:", taskData);

      setTask(taskData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [params]);

  if (loading) {
    return <Loading />;
  }

  if (error || !task) {
    return <ErrorDisplay error={error || "Task not found"} router={router} />;
  }

  return (
    <div className="p-6 space-y-8">
      <TaskDetailHeader task={task} refetch={fetchTask} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TaskDescription task={task} />
          <TaskSubtasks task={task} refetch={fetchTask} />
        </div>

        <TaskSidebar task={task} />
      </div>
      <TaskTabs task={task} refetch={fetchTask} />
    </div>
  );
}
