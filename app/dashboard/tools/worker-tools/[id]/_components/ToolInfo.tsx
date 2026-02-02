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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
              <div className="font-medium text-lg">
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
              <div className="font-medium">
                {tool.createdAt
                  ? format(new Date(tool.createdAt), "PPP")
                  : "N/A"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-muted-foreground font-semibold">
              Description
            </Label>
            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {tool.description || "No description provided for this tool."}
            </div>
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
