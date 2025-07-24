"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES, Product } from "@/types/product";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { ProductFormValues, productSchema } from "@/lib/formValidationSchemas";

interface ProductFormProps {
  type: "create" | "update";
  data?: Product;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export function ProductForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: data?.category || "",
      size: data?.size || "",
      price: data?.price || 0,
      panels: data?.panels || undefined,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const url =
        type === "create" ? "/api/products" : `/api/products/${data?.id}`;
      const method = type === "create" ? "post" : "put";

      const response = await axios[method](url, values);

      toast.success(
        `Product ${type === "create" ? "created" : "updated"} successfully`
      );
      onSubmitSuccess?.();
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("A product with this category and size already exists");
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
      console.error("Product submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={cn("grid grid-cols-1 gap-6", "md:grid-cols-2")}>
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
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

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size/Dimensions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 600x600, 2400x2100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (ZAR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="panels"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Panels (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 4, 5"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-6">
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
            ) : type === "create" ? (
              "Add Product"
            ) : (
              "Update Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
