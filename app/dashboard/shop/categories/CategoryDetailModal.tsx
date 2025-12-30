"use client";

import React from "react";
import Image from "next/image";
import {
  X,
  Package,
  Calendar,
  FileText,
  Image as ImageIcon,
  Box,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    description: string | null;
    images: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      products: number;
    };
  };
}

export default function CategoryDetailModal({
  isOpen,
  onClose,
  category,
}: CategoryDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Category Details
              </h2>
              <p className="text-muted-foreground">
                View detailed information about this category
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Category Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    {category.images ? (
                      <Image
                        src={category.images}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="gap-1">
                        <Box className="h-3 w-3" />
                        {category._count.products} product
                        {category._count.products !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>

                {category.description && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Description</h4>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line">
                        {category.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Created</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(category.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Last Updated</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(category.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(category.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Category Image</h4>
                </div>
              </div>

              {category.images ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="relative aspect-video w-full max-w-md mx-auto rounded-md overflow-hidden border">
                    <Image
                      src={category.images}
                      alt={category.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {category.images.split("/").pop()}
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No image uploaded
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add an image when editing this category
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
