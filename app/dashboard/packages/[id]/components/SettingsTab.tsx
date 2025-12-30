"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackageData } from "../types";
import { updatePackage } from "../actions";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsTabProps {
  packageData: PackageData;
  onUpdate: () => void;
}

export default function SettingsTab({
  packageData,
  onUpdate,
}: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    featured: packageData.featured,
    isPublic: packageData.isPublic,
    status: packageData.status,
  });

  const handleToggle = async (field: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    try {
      setLoading(true);
      await updatePackage(packageData.id, { [field]: value });
      toast({
        title: "Settings updated",
        description: `Package ${field} has been updated.`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      // Revert on error
      setSettings({ ...settings, [field]: !value });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = settings.status;
    setSettings({ ...settings, status: newStatus });

    try {
      setLoading(true);
      await updatePackage(packageData.id, { status: newStatus });
      toast({
        title: "Status updated",
        description: `Package status changed to ${newStatus}.`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      // Revert on error
      setSettings({ ...settings, status: oldStatus });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {packageData.status === "DRAFT" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This package is in draft mode and is not visible to customers.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Package Settings</CardTitle>
          <CardDescription>
            Configure package visibility and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Featured Package</Label>
              <p className="text-sm text-muted-foreground">
                Display this package prominently
              </p>
            </div>
            <Switch
              checked={settings.featured}
              onCheckedChange={(checked) => handleToggle("featured", checked)}
              disabled={loading}
            />
          </div>
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Show this package to customers
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => handleToggle("isPublic", checked)}
              disabled={loading}
            />
          </div>
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package Status</Label>
              <p className="text-sm text-muted-foreground">
                Control the availability of this package
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={settings.status === "ACTIVE" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={loading || settings.status === "ACTIVE"}
              >
                Active
              </Button>
              <Button
                variant={settings.status === "INACTIVE" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("INACTIVE")}
                disabled={loading || settings.status === "INACTIVE"}
              >
                Inactive
              </Button>
              <Button
                variant={settings.status === "DRAFT" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange("DRAFT")}
                disabled={loading || settings.status === "DRAFT"}
              >
                Draft
              </Button>
            </div>
          </div>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="packageTags">Tags</Label>
            <Input
              id="packageTags"
              defaultValue={packageData.tags.join(", ")}
              placeholder="Add tags separated by commas"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Edit tags in the package edit dialog
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageBenefits">Benefits</Label>
            <Input
              id="packageBenefits"
              value={packageData.benefits.join(", ")}
              placeholder="Benefits separated by commas"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Edit benefits in the package edit dialog
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
            <div className="space-y-0.5">
              <Label className="text-destructive">Delete Package</Label>
              <p className="text-sm text-muted-foreground">
                Once deleted, this package cannot be recovered. All associated
                data will be removed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to delete this package? This action cannot be undone."
                  )
                ) {
                  // Delete action is handled in PackageHeader component
                }
              }}
            >
              Delete Package
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Archive Package</Label>
              <p className="text-sm text-muted-foreground">
                Archive this package to hide it from customers while preserving
                data.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleStatusChange("ARCHIVED")}
              disabled={loading || settings.status === "ARCHIVED"}
            >
              Archive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
