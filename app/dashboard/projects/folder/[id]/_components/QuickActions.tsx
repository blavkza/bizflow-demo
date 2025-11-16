import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download, Users } from "lucide-react";
import { FileItem } from "./types";
import ShareDialog from "./ShareDialog";
import AccessDialog from "./AccessDialog";

interface QuickActionsProps {
  folderId: string;
  folderTitle: string;
  files: FileItem[];
  onDownloadAll: () => void;
}

export default function QuickActions({
  folderId,
  folderTitle,
  files,
  onDownloadAll,
}: QuickActionsProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent hover:bg-blue-50"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Folder
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start bg-transparent hover:bg-green-50"
            onClick={onDownloadAll}
            disabled={files.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start bg-transparent hover:bg-purple-50"
            onClick={() => setShowAccessDialog(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Access
          </Button>
        </CardContent>
      </Card>

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        folderId={folderId}
        folderTitle={folderTitle}
      />

      <AccessDialog
        isOpen={showAccessDialog}
        onClose={() => setShowAccessDialog(false)}
      />
    </>
  );
}
