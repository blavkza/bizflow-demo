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
import { Tool, UploadedFile } from "@/types/tool";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { categories, safeNumber } from "../utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "../../shop/products/components/ImageUpload";

const toolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive"),
  purchaseDate: z.string().optional().default(""),
  rentalRateDaily: z.coerce.number().min(0).optional().default(0),
  rentalRateWeekly: z.coerce.number().min(0).optional().default(0),
  rentalRateMonthly: z.coerce.number().min(0).optional().default(0),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "RETIRED", "INTERUSE"]),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]),
  primaryImage: z.string().optional().default(""),
  images: z.array(z.string()).default([]),
  canBeRented: z.boolean().default(true),
});

type ToolFormData = z.infer<typeof toolSchema>;

interface ToolFormProps {
  tool?: Tool;
  onSubmit: (data: ToolFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ToolForm({
  tool,
  onSubmit,
  onCancel,
  loading = false,
}: ToolFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<UploadedFile[]>(
    tool?.images?.map((url) => ({
      url,
      name: `Image_${url.split("/").pop()}`,
      type: "IMAGE" as const,
      size: 0,
      mimeType: "image/jpeg",
    })) || [],
  );

  const form = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      name: tool?.name || "",
      description: tool?.description || "",
      category: tool?.category || "",
      purchasePrice: safeNumber(tool?.purchasePrice),
      purchaseDate: tool?.purchaseDate?.split("T")[0] || "",
      rentalRateDaily: safeNumber(tool?.rentalRateDaily),
      rentalRateWeekly: safeNumber(tool?.rentalRateWeekly),
      rentalRateMonthly: safeNumber(tool?.rentalRateMonthly),
      status: tool?.status || "AVAILABLE",
      condition: tool?.condition || "GOOD",
      primaryImage: tool?.primaryImage || "",
      images: tool?.images || [],
      canBeRented: tool
        ? tool.rentalRateDaily !== null && tool.rentalRateDaily !== undefined
        : true, // Default to true for new tools
    },
  });

  const { isSubmitting } = form.formState;
  const canBeRented = form.watch("canBeRented");

  const handleImageUpload = (file: UploadedFile) => {
    setImages((prev) => [...prev, file]);
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, file.url]);

    // Set as primary image if it's the first one
    if (images.length === 0) {
      form.setValue("primaryImage", file.url);
    }
  };

  const handleImageRemove = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url));
    const currentImages = form.getValues("images") || [];
    form.setValue(
      "images",
      currentImages.filter((img) => img !== url),
    );

    // Update primary image if it was removed
    if (form.getValues("primaryImage") === url) {
      form.setValue("primaryImage", images[0]?.url || "");
    }
  };

  const onFormSubmit = async (values: ToolFormData) => {
    try {
      // If tool cannot be rented, clear rental rates
      if (!values.canBeRented) {
        values.rentalRateDaily = 0;
        values.rentalRateWeekly = 0;
        values.rentalRateMonthly = 0;
      }

      await onSubmit(values);
      toast.success(
        tool ? "Tool updated successfully" : "Tool created successfully",
      );
    } catch (error) {
      toast.error("Failed to save tool");
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Tool Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Tool Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tool name" {...field} />
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
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Tool description and details..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Selector */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rental Availability */}
          <FormField
            control={form.control}
            name="canBeRented"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Available for Rental</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable this tool to be rented out to customers
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Purchase Price (ZAR) *</FormLabel>
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
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Rental Rates - Only show if tool can be rented */}
          {canBeRented && (
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-700">Rental Rates</h3>
                <p className="text-sm text-muted-foreground">
                  Set rental rates for this tool
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rentalRateDaily"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Daily Rate (ZAR)</FormLabel>
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
                  name="rentalRateWeekly"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Weekly Rate (ZAR)</FormLabel>
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
                  name="rentalRateMonthly"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Monthly Rate (ZAR)</FormLabel>
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
            </div>
          )}

          {/* Status and Condition */}
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
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="RENTED">Rented</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                      <SelectItem value="INTERUSE">Internal Use</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Condition</FormLabel>
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
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tool Images */}
          <div className="space-y-2">
            <FormLabel>Tool Images</FormLabel>
            <p className="text-sm text-muted-foreground mb-2">
              Upload tool images (PNG, JPG, GIF up to 5MB)
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

          {/* Primary Image Selection */}
          {images.length > 0 && (
            <FormField
              control={form.control}
              name="primaryImage"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Primary Image</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary image" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {images.map((image) => (
                        <SelectItem key={image.url} value={image.url}>
                          {image.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
          <Button type="submit" disabled={isSubmitting} className="min-w-24">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tool ? (
              "Update Tool"
            ) : (
              "Create Tool"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
