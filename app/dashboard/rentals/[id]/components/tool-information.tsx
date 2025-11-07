import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { ToolRentalDetail } from "../types";
import { getToolImage, formatDecimal } from "../utils";
import Image from "next/image";

interface ToolInformationProps {
  rental: ToolRentalDetail;
}

export default function ToolInformation({ rental }: ToolInformationProps) {
  const toolImage = getToolImage(rental.tool);

  const renderFormattedText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
  };

  const hasHTMLTags = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "";

    if (hasHTMLTags(description)) {
      return renderFormattedText(description);
    }

    return description.replace(/\n/g, "<br>");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {toolImage ? (
              <Image
                src={toolImage || "/placeholder.png"}
                alt={rental.tool.name}
                width={800}
                height={450}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tool Name</p>
              <p className="font-medium">{rental.tool.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Rate</p>
              <p className="font-medium">
                R{formatDecimal(rental.rentalRate).toFixed(2)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              asChild
            >
              <Link href={`/dashboard/tools/${rental.toolId}`}>
                View Tool Details
              </Link>
            </Button>
          </div>
        </div>
        {rental.tool.description && (
          <div
            className="prose prose-sm max-w-none text-muted-foreground "
            dangerouslySetInnerHTML={{
              __html: getDescriptionHTML(rental.tool.description || ""),
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
