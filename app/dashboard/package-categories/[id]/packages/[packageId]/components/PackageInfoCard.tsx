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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Information</CardTitle>
        <CardDescription>Basic package details and metadata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Category</Label>
            <p className="font-medium">
              {packageData.category?.name || "Uncategorized"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Classification</Label>
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
              <div
                className="mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: packageData.notes }}
              />
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
