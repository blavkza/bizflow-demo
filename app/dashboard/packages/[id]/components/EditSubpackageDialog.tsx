"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Subpackage } from "../types";
import { updateSubpackage } from "../actions";
import { toast } from "@/components/ui/use-toast";

interface EditSubpackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subpackage: Subpackage | null;
  onSuccess: () => void;
}

export default function EditSubpackageDialog({
  open,
  onOpenChange,
  subpackage,
  onSuccess,
}: EditSubpackageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    discount: 0,
    duration: "",
    isDefault: false,
    status: "ACTIVE",
    features: [""],
  });

  useEffect(() => {
    if (subpackage) {
      setFormData({
        name: subpackage.name || "",
        description: subpackage.description || "",
        price: subpackage.price || 0,
        originalPrice: subpackage.originalPrice || 0,
        discount: subpackage.discount || 0,
        duration: subpackage.duration || "",
        isDefault: subpackage.isDefault || false,
        status: subpackage.status || "ACTIVE",
        features: subpackage.features || [""],
      });
    }
  }, [subpackage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subpackage) return;

    try {
      setLoading(true);
      await updateSubpackage(subpackage.id, formData);
      toast({
        title: "Subpackage updated",
        description: "The subpackage has been updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subpackage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  if (!subpackage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Subpackage</DialogTitle>
            <DialogDescription>
              Update subpackage information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSubName">Subpackage Name</Label>
              <Input
                id="editSubName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Basic Plan, Professional Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSubDescription">Description</Label>
              <Textarea
                id="editSubDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editSubPrice">Price (R)</Label>
                <Input
                  id="editSubPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSubOriginalPrice">Original Price</Label>
                <Input
                  id="editSubOriginalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSubDuration">Duration</Label>
                <Input
                  id="editSubDuration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., Monthly, One-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editSubStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSubDiscount">Discount %</Label>
                <Input
                  id="editSubDiscount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editSubDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
              <Label htmlFor="editSubDefault">Set as default subpackage</Label>
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) =>
                        handleFeatureChange(index, e.target.value)
                      }
                      placeholder={`Feature ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      disabled={formData.features.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                >
                  Add Feature
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
