"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "./ImageUpload";
import {
  Product,
  ProductFormData,
  Category,
  UploadedFile,
} from "@/types/product";
import {
  ShopProductSchema,
  ShopProductSchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading = false,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<UploadedFile[]>(
    product?.images?.map((url) => ({
      url,
      name: `Image_${url.split("/").pop()}`,
      type: "IMAGE" as const,
      size: 0,
      mimeType: "image/jpeg",
    })) || []
  );
  const [documents, setDocuments] = useState<UploadedFile[]>(
    product?.documents?.map((doc) => ({
      url: doc.url,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
    })) || []
  );

  const form = useForm<ShopProductSchemaType>({
    resolver: zodResolver(ShopProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      category: product?.category || "",
      price: product?.price || 0,
      costPrice: product?.costPrice || 0,
      stock: product?.stock || 0,
      minStock: product?.minStock || 0,
      maxStock: product?.maxStock || 0,
      weight: product?.weight || 0,
      dimensions: product?.dimensions || "",
      color: product?.color || "",
      size: product?.size || "",
      brand: product?.brand || "",
      status: product?.status || "ACTIVE",
      featured: product?.featured || false,
      images: product?.images || [],
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/shop/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const handleImageUpload = (file: UploadedFile) => {
    setImages((prev) => [...prev, file]);
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, file.url]);
  };

  const handleImageRemove = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url));
    const currentImages = form.getValues("images") || [];
    form.setValue(
      "images",
      currentImages.filter((img) => img !== url)
    );
  };

  const handleDocumentUpload = (file: UploadedFile) => {
    setDocuments((prev) => [...prev, file]);
  };

  const handleDocumentRemove = (url: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.url !== url));
  };

  const onFormSubmit = async (values: ShopProductSchemaType) => {
    try {
      const submitData: ProductFormData = {
        ...values,
        images: images.map((img) => img.url),
        documents: documents.map((doc) => doc.url),
      };

      console.log("Submitting product data:", submitData);
      await onSubmit(submitData);
      toast.success(
        product
          ? "Product updated successfully"
          : "Product created successfully"
      );
    } catch (error) {
      toast.error("Failed to save product");
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Product description and details..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU and Category */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>SKU *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Price (ZAR) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Cost Price (ZAR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Min Stock</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxStock"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Max Stock</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Brand and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Product brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.000"
                      step="0.001"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Color and Size */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Product color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <Input placeholder="Product size" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dimensions */}
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Dimensions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 10x5x2 cm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status and Featured */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="space-y-2 flex items-center space-x-2 pt-8">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Featured Product</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <FormLabel>Product Images</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">
              Upload product images (PNG, JPG, GIF up to 5MB)
            </p>
            <ImageUpload
              onFileUpload={handleImageUpload}
              onFileRemove={handleImageRemove}
              existingFiles={images}
              allowedTypes={["IMAGE"]}
              multiple={true}
            />
            <FormMessage />
          </div>

          {/* Product Documents */}
          <div className="space-y-2">
            <FormLabel>Product Documents</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">
              Upload product documents, manuals, specifications (PDF, DOC, XLS
              up to 10MB)
            </p>
            <ImageUpload
              onFileUpload={handleDocumentUpload}
              onFileRemove={handleDocumentRemove}
              existingFiles={documents}
              allowedTypes={["PDF", "DOCUMENT"]}
              multiple={true}
            />
            <FormMessage />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : product ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
