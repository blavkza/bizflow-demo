"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, DollarSign, Hash, Tag, Info } from "lucide-react";

interface ToolInfoProps {
  tool: any;
}

export function ToolInfo({ tool }: ToolInfoProps) {
  const hasHTMLTags = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "No description provided for this tool.";

    if (hasHTMLTags(description)) {
      return description;
    }

    return description.replace(/\n/g, "<br>");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tool Name Header - matching requested style */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="mt-4 truncate text-xl font-semibold text-stone-950 dark:text-stone-50">
              {tool.name}
            </h3>
            {tool.status === "ALLOCATED" &&
              (tool.employee || tool.freelancer) && (
                <div className="sm:mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                  >
                    Currently Assigned to:{" "}
                    {tool.employee
                      ? tool.employee.name ||
                        `${tool.employee.firstName} ${tool.employee.lastName}`
                      : `${tool.freelancer.firstName} ${tool.freelancer.lastName}`}
                  </Badge>
                </div>
              )}
          </div>

          <Separator />

          {/* Main Info Grid */}
          <div className="flex flex-col md:flex-row gap-6">
            {tool.primaryImage && (
              <div className="w-full md:w-1/3 lg:w-1/4">
                <div className="relative aspect-square rounded-lg overflow-hidden border shadow-sm">
                  <Image
                    src={tool.primaryImage}
                    alt={tool.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Category
                </Label>
                <div className="font-medium text-lg">
                  {tool.category || "General"}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Serial Number
                </Label>
                <div className="font-mono text-base">
                  {tool.serialNumber || "N/A"}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Purchase Price
                </Label>
                <div className="font-medium text-lg text-green-700 dark:text-green-400">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(tool.purchasePrice || 0)}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created Date
                </Label>
                <div className="font-medium text-base">
                  {tool.createdAt
                    ? format(new Date(tool.createdAt), "PPP")
                    : "N/A"}
                </div>
              </div>

              {tool.code && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide flex items-center gap-1">
                    <Info className="h-3 w-3" /> Tool Code
                  </Label>
                  <div className="font-medium text-base">{tool.code}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-muted-foreground font-semibold">
              Description
            </Label>
            <div
              className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: getDescriptionHTML(tool.description || ""),
              }}
            />
          </div>
        </CardContent>
      </Card>

      {tool.images && tool.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(tool.images as string[]).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border shadow-sm group"
                >
                  <Image
                    src={img}
                    alt={`Tool image ${idx + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
