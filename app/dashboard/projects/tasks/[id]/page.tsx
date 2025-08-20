// app/tasks/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  User,
  Flag,
  Home,
  ChevronRight,
} from "lucide-react";
import {
  tasks,
  mockSubtasks,
  mockComments,
  mockAttachments,
  teamMembers,
} from "@/lib/data";
import { useRouter } from "next/navigation";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const router = useRouter();

  const [isAddSubtaskOpen, setIsAddSubtaskOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [subtasks, setSubtasks] = React.useState(mockSubtasks);

  const task = tasks[id as keyof typeof tasks] || tasks["task-1"];
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const progressPercentage =
    subtasks.length > 0
      ? Math.round((completedSubtasks / subtasks.length) * 100)
      : 0;

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-500";
      case "in-progress":
        return "bg-blue-500";
      case "review":
        return "bg-yellow-500";
      case "done":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className=" mx-auto p-4 space-y-6 ">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <ArrowLeft size={16} />
            </Button>
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
            />
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          </div>
          <div className="flex items-center space-x-4 ml-12">
            <Badge variant="outline" className="text-xs">
              {task.project.name}
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Assign to me
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="mr-2 h-4 w-4" />
                Change priority
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Subtasks</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>
                      {completedSubtasks} of {subtasks.length} completed
                    </span>
                    <span>•</span>
                    <span>{progressPercentage}% done</span>
                  </div>
                </div>
                <Dialog
                  open={isAddSubtaskOpen}
                  onOpenChange={setIsAddSubtaskOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subtask
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Subtask</DialogTitle>
                      <DialogDescription>
                        Create a new subtask to break down this task into
                        smaller pieces.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subtask-title">Title</Label>
                        <Input
                          id="subtask-title"
                          placeholder="Enter subtask title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtask-assignee">Assignee</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subtask-priority">Priority</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subtask-due">Due Date</Label>
                          <Input id="subtask-due" type="date" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={() => setIsAddSubtaskOpen(false)}
                      >
                        Add Subtask
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {subtask.title}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(subtask.priority)}`}
                          >
                            {subtask.priority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={
                                subtask.assignee.avatar || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {subtask.assignee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{subtask.assignee.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(subtask.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Comments, Attachments, etc. */}
          <Tabs defaultValue="comments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="comments">
                Comments ({mockComments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments ({mockAttachments.length})
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" disabled={!newComment.trim()}>
                            Comment
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {mockComments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.author.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {comment.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {comment.author.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Files</h4>
                      <Button size="sm" variant="outline">
                        <Paperclip className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {mockAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border"
                        >
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.size} • Uploaded by{" "}
                              {attachment.uploadedBy} on{" "}
                              {new Date(
                                attachment.uploadedAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="font-medium">Sarah Johnson</span>
                      <span className="text-muted-foreground">
                        updated the task description
                      </span>
                      <span className="text-xs text-muted-foreground">
                        2 hours ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="font-medium">Mike Chen</span>
                      <span className="text-muted-foreground">
                        completed subtask "Create button component"
                      </span>
                      <span className="text-xs text-muted-foreground">
                        1 day ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="font-medium">Emily Davis</span>
                      <span className="text-muted-foreground">
                        was assigned to this task
                      </span>
                      <span className="text-xs text-muted-foreground">
                        3 days ago
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Time Tracked
                        </Label>
                        <p className="text-2xl font-bold">{task.timeTracked}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Estimated
                        </Label>
                        <p className="text-2xl font-bold">
                          {task.timeEstimate}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">62.5%</span>
                      </div>
                      <Progress value={62.5} className="h-2" />
                    </div>
                    <Button size="sm" className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Start Timer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
                  />
                  <span className="text-sm capitalize">
                    {task.status.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Assignee
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={task.assignee.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.assignee.name}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Reporter
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={task.reporter.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback className="text-xs">
                      {task.reporter.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.reporter.name}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Priority
                </Label>
                <p
                  className={`text-sm mt-1 font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Due Date
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Project
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="text-sm hover:underline"
                  >
                    {task.project.name}
                  </Link>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Labels
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
              >
                <User className="mr-2 h-4 w-4" />
                Assign to Me
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
              >
                <Clock className="mr-2 h-4 w-4" />
                Log Time
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
