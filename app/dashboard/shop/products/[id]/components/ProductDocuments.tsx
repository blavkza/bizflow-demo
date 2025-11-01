import { Download, Image, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ProductDocumentsProps {
  documents: Document[];
}

export function ProductDocuments({ documents }: ProductDocumentsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <Image className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Product Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    {getFileIcon(document.type)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">{document.name}</div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {document.type.toLowerCase()}
                    </Badge>
                    <span>{formatFileSize(document.size)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={document.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
