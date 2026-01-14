"use client";

import Image from "next/image";
import { Box } from "lucide-react";
import { PackageProduct } from "../../../types";

interface ProductImageProps {
  product: PackageProduct;
  size?: "sm" | "md" | "lg";
}

export default function ProductImage({
  product,
  size = "md",
}: ProductImageProps) {
  const getProductImage = (images: any) => {
    try {
      if (!images) return null;

      if (typeof images === "string") {
        if (images.startsWith("http") || images.startsWith("/")) {
          return images;
        }

        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
          return parsed;
        } catch {
          return images;
        }
      }

      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }

      return null;
    } catch (error) {
      console.error("Error parsing product images:", error);
      return null;
    }
  };

  const imageUrl = getProductImage(product.image);
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  if (!imageUrl) {
    return (
      <div
        className={`${sizeClasses[size]} flex-shrink-0 rounded-md bg-muted flex items-center justify-center`}
      >
        <Box
          className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} text-muted-foreground`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} relative flex-shrink-0 rounded-md overflow-hidden border`}
    >
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        className="object-cover"
        sizes={`${size === "sm" ? "32px" : size === "md" ? "40px" : "48px"}`}
      />
    </div>
  );
}
