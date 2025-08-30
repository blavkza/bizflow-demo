import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  CheckCircle2,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  Task,
  getStatusColor,
  getPriorityColor,
  formatStatus,
} from "@/types/tasks";
import { Badge } from "@/components/ui/badge";

interface TaskSidebarProps {
  task: Task;
}

export default function TaskSidebar({ task }: TaskSidebarProps) {
  return (
    <div className="space-y-6">
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
                {formatStatus(task.status)}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Assignees
            </Label>
            <div className="space-y-2 mt-1">
              {task.assignees.map((assignee) => (
                <div key={assignee?.id} className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignee?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {assignee.firstName +
                        assignee?.lastName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {assignee?.firstName} {assignee?.lastName} (
                    {assignee?.position})
                  </span>
                </div>
              ))}
              {task.assignees.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Unassigned
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Priority
            </Label>
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
          </div>

          {task.dueDate && (
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
          )}

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Project
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.project.color || "#6b7280" }}
              />
              <Link
                href={`/projects/${task.project.id}`}
                className="text-sm hover:underline"
              >
                {task.project.title}
              </Link>
            </div>
          </div>

          {task.estimatedHours && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Estimated Hours
              </Label>
              <p className="text-sm mt-1">{task.estimatedHours}h</p>
            </div>
          )}

          {task.actualHours && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Actual Hours
              </Label>
              <p className="text-sm mt-1">{task.actualHours}h</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {/*   <Card>
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
      </Card> */}
    </div>
  );
}
