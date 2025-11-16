import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileItem, Note } from "./types";
import { formatTotalSize } from "../utils";

interface FolderStatsProps {
  documents: FileItem[];
  notes: Note[];
}

export default function FolderStats({
  documents = [],
  notes = [],
}: FolderStatsProps) {
  const stats = {
    totalFiles: documents.length,
    totalSize: documents.reduce((acc, file) => acc + (file.size || 0), 0),
    recentActivity: documents.filter(
      (file) =>
        new Date().getTime() - new Date(file.lastModified).getTime() <
        7 * 24 * 60 * 60 * 1000
    ).length,
    sharedFiles: documents.filter((file) => file.shared).length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Folder Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFiles}
            </div>
            <div className="text-xs text-gray-500">Total Files</div>
          </div>
          <div className="text-center p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatTotalSize(stats.totalSize)}
            </div>
            <div className="text-xs text-gray-500">Storage Used</div>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Recent Activity</span>
            <Badge variant="secondary">{stats.recentActivity}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Shared Files</span>
            <Badge variant="secondary">{stats.sharedFiles}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Notes</span>
            <Badge variant="secondary">{notes.length}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
