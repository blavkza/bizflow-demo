"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Heart,
  Reply,
  MoreHorizontal,
  Pin,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Comment, CommentReply, Project } from "../type";

interface ProjectCommentsProps {
  project: Project;
  user: User | null;
  fetchProject: () => void;
}

export function ProjectComments({
  project,
  user,
  fetchProject,
}: ProjectCommentsProps) {
  const router = useRouter();
  const [newComment, setNewComment] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  console.log("project:", project);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/comments", {
        content: newComment,
        projectId: project.id,
      });
      setNewComment("");
      fetchProject();
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/comments/replies", {
        content: replyContent,
        commentId,
        projectId: project.id,
      });
      setReplyContent("");
      setReplyingTo(null);
      fetchProject();
      toast.success("Reply posted successfully");
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (
    commentId: string,
    currentlyPinned: boolean
  ) => {
    try {
      await axios.patch("/api/comments", {
        id: commentId,
        pinned: !currentlyPinned,
        projectId: project.id,
      });
      fetchProject();
      toast.success(`Comment ${currentlyPinned ? "unpinned" : "pinned"}`);
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleToggleLike = async (
    commentId: string,
    currentlyLiked: boolean
  ) => {
    try {
      await axios.patch("/api/comments", {
        id: commentId,
        liked: !currentlyLiked,
        projectId: project.id,
      });
      fetchProject();
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await axios.delete("/api/comments", {
        data: { id: commentId, projectId: project.id },
      });
      fetchProject();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleToggleReplyLike = async (
    replyId: string,
    currentlyLiked: boolean
  ) => {
    try {
      await axios.patch("/api/comments/replies", {
        id: replyId,
        liked: !currentlyLiked,
        projectId: project.id,
      });
      fetchProject();
    } catch (error) {
      console.error("Failed to toggle reply like:", error);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await axios.delete("/api/comments/replies", {
        data: { id: replyId, projectId: project.id },
      });
      fetchProject();
      toast.success("Reply deleted successfully");
    } catch (error) {
      console.error("Failed to delete reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Discussion
        </h3>
        <Badge variant="secondary" className="px-2 py-1">
          {project.comment?.length || 0} comments
        </Badge>
      </div>

      {/* New Comment */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={user?.avatar || "/placeholder-user.jpg"}
                alt={user?.name || "User"}
              />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-500 text-white hover:bg-blue-400"
                >
                  {isSubmitting ? (
                    "Posting..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {project.comment?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts</p>
          </div>
        ) : (
          project.comment?.map((comment: Comment) => (
            <Card
              key={comment.id}
              className={
                comment.pinned
                  ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                  : "border-border"
              }
            >
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={comment.commenterAvatar || "/placeholder-user.jpg"}
                      alt={comment.commenterName}
                    />
                    <AvatarFallback>
                      {getInitials(comment.commenterName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {comment.commenterName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comment.commenterRole || "User"}
                        </Badge>
                        {comment.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="mr-1 h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
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
                            <DropdownMenuItem
                              onClick={() =>
                                handleTogglePin(comment.id, comment.pinned)
                              }
                            >
                              <Pin className="mr-2 h-4 w-4" />
                              {comment.pinned ? "Unpin" : "Pin"} Comment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">{comment.content}</p>

                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          handleToggleLike(comment.id, comment.liked)
                        }
                      >
                        <Heart
                          className={`mr-1 h-3 w-3 ${comment.liked ? "fill-current text-red-500" : ""}`}
                        />
                        {comment.liked ? 1 : 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <Reply className="mr-1 h-3 w-3" />
                        Reply
                      </Button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 flex space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user?.avatar || "/placeholder-user.jpg"}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[80px] text-sm"
                            disabled={isSubmitting}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || isSubmitting}
                              className="bg-blue-500 text-white hover:bg-blue-400"
                            >
                              {isSubmitting ? "Posting..." : "Reply"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(null)}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.commentReply?.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-muted pl-4">
                        {comment.commentReply.map((reply: CommentReply) => (
                          <div key={reply.id} className="flex space-x-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={
                                  reply.commenterAvatar ||
                                  "/placeholder-user.jpg"
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(reply.commenterName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium">
                                  {reply.commenterName}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {reply.commenterRole || "User"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        handleDeleteReply(reply.id)
                                      }
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="text-xs leading-relaxed">
                                {reply.content}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1 text-xs"
                                  onClick={() =>
                                    handleToggleReplyLike(reply.id, reply.liked)
                                  }
                                >
                                  <Heart
                                    className={`mr-1 h-2 w-2 ${reply.liked ? "fill-current text-red-500" : ""}`}
                                  />
                                  {reply.liked ? 1 : 0}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
