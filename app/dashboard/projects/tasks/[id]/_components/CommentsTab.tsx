"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/tasks";

interface CommentsTabProps {
  task: Task;
}

export default function CommentsTab({ task }: CommentsTabProps) {
  const [newComment, setNewComment] = useState("");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={"/placeholder.svg"} />
              <AvatarFallback>U</AvatarFallback>
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
            {task.comment.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.commenterAvatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {comment.commenterName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {comment.commenterName}
                    </span>
                    {comment.commenterRole && (
                      <Badge variant="outline" className="text-xs">
                        {comment.commenterRole}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
            {task.comment.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
