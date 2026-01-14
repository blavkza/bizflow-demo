"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PackageData } from "../types";
import { format } from "date-fns";

interface PackageInfoCardProps {
  packageData: PackageData;
}

export default function PackageInfoCard({ packageData }: PackageInfoCardProps) {
  const getClassificationColor = (classification: string | null) => {
    switch (classification?.toUpperCase()) {
      case "CLASS_1_A":
        return "bg-purple-100 text-purple-800";
      case "CLASS_1_B":
        return "bg-blue-100 text-blue-800";
      case "CLASS_2_A":
        return "bg-orange-100 text-orange-800";
      case "CLASS_2_B":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Information</CardTitle>
        <CardDescription>Basic package details and metadata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Package Type</Label>
            <p className="font-medium">{packageData.packageType}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Category</Label>
            <p className="font-medium">
              {packageData.category?.name || "Uncategorized"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Classification</Label>
            <Badge
              className={getClassificationColor(packageData.classification)}
            >
              {packageData.classification || "Unclassified"}
            </Badge>
          </div>
          <div>
            <Label className="text-muted-foreground">Created</Label>
            <p className="font-medium">
              {format(new Date(packageData.createdAt), "PPP")}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Last Updated</Label>
            <p className="font-medium">
              {format(new Date(packageData.updatedAt), "PPP")}
            </p>
          </div>
        </div>
        <Separator />
        <div>
          <Label className="text-muted-foreground">Description</Label>
          <p className="mt-1">
            {packageData.description || "No description provided."}
          </p>
        </div>
        {packageData.shortDescription && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Short Description</Label>
              <p className="mt-1">{packageData.shortDescription}</p>
            </div>
          </>
        )}
        {packageData.notes && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <p className="mt-1">{packageData.notes}</p>
            </div>
          </>
        )}
        {packageData.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {packageData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
        {packageData.benefits.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Benefits</Label>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {packageData.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
