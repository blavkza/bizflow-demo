import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileItem } from "./types";

interface RecentActivityProps {
  documents: FileItem[] | null | undefined;
}

export default function RecentActivity({ documents }: RecentActivityProps) {
  const safeDocs = Array.isArray(documents) ? documents : [];

  const recentDocuments = safeDocs
    .slice() // prevent mutating original array
    .sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime() || 0;
      const dateB = new Date(b.uploadedAt).getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const colors = ["bg-green-500", "bg-blue-500", "bg-purple-500"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {recentDocuments.length === 0 && (
          <p className="text-sm text-gray-500">No recent activity.</p>
        )}

        <div className="space-y-3">
          {recentDocuments.map((doc, index) => (
            <div
              key={doc.id || index}
              className="flex items-start gap-3 text-sm"
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  colors[index] || "bg-gray-400"
                }`}
              ></div>

              <div>
                <p className="font-medium truncate max-w-[200px]">{doc.name}</p>

                <p className="text-gray-500 text-xs">
                  Uploaded{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString("en-ZA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
