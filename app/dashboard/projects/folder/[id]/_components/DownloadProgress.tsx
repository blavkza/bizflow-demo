import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

interface DownloadProgressProps {
  isDownloading: boolean;
  downloadProgress: number;
}

export default function DownloadProgress({
  isDownloading,
  downloadProgress,
}: DownloadProgressProps) {
  if (!isDownloading) return null;

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Download className="h-5 w-5" />
          Preparing Download
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Compressing files...</span>
            <span className="text-green-600">{downloadProgress}%</span>
          </div>
          <Progress value={downloadProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
