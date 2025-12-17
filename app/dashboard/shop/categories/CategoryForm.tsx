"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Upload, ImageIcon, Loader2 } from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    images?: string;
  }) => void;
  title: string;
  initialData?: {
    name: string;
    description: string;
    images?: string;
  };
}

export default function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    images: initialData?.images || "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Parse existing image from initialData
  useEffect(() => {
    if (initialData?.images) {
      setPreviewImage(initialData.images);
    } else {
      setPreviewImage(null);
    }
  }, [initialData]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/shop/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPreviewImage(data.url);
      setFormData((prev) => ({
        ...prev,
        images: data.url,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    await handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = () => {
    setPreviewImage(null);
    setFormData((prev) => ({
      ...prev,
      images: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update category details"
              : "Add a new product category to your store"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Electronics, Clothing, Books"
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed on your store and used for organization
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this category contains..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional description to help identify this category
              </p>
            </div>

            <Separator />

            {/* Category Image */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Category Image</Label>
                <p className="text-sm text-muted-foreground">
                  Upload a representative image for this category (optional)
                </p>
              </div>

              {previewImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden border">
                    <Image
                      src={previewImage}
                      alt="Category preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm font-medium">Uploading image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Drag and drop an image here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports JPG, PNG, GIF up to 5MB
                        </p>
                      </div>
                      <Button type="button" variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Select Image
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
