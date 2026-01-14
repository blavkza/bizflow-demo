"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Subpackage } from "../../../types";

interface SubpackageSettingsTabProps {
  subpackage: Subpackage;
  packageId: string;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function SubpackageSettingsTab({
  subpackage,
  packageId,
  onDelete,
  isDeleting,
}: SubpackageSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subpackage Settings</CardTitle>
        <CardDescription>
          Manage subpackage configuration and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Subpackage ID</p>
              <p className="text-sm text-muted-foreground">
                Unique identifier for this subpackage
              </p>
            </div>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {subpackage.id}
            </code>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Package</p>
              <p className="text-sm text-muted-foreground">
                Parent package of this subpackage
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/packages/${packageId}`}>View Package</Link>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Default Subpackage</p>
              <p className="text-sm text-muted-foreground">
                When enabled, this subpackage will be selected by default
              </p>
            </div>
            <Badge variant={subpackage.isDefault ? "default" : "outline"}>
              {subpackage.isDefault ? "Yes" : "No"}
            </Badge>
          </div>

          <Separator />

          <div>
            <p className="font-medium mb-2">Notes</p>
            {subpackage.notes ? (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-muted-foreground">{subpackage.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes added</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Subpackage"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
