import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { Task } from "@/types/tasks";

interface AttachmentsTabProps {
  task: Task;
}

export default function AttachmentsTab({ task }: AttachmentsTabProps) {
  return (
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
            {task.documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center space-x-3 p-3 rounded-lg border"
              >
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{document.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {document.size
                      ? `${(document.size / 1024).toFixed(1)} KB`
                      : "Unknown size"}{" "}
                    • {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </Button>
              </div>
            ))}
            {task.documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No attachments yet</p>
                <p className="text-sm">Upload files to share with the team</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
