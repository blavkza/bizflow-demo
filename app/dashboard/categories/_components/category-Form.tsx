"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
} from "@/components/ui/form";
import {
  CategorySchema,
  categorySchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryStatus, CategoryType } from "@prisma/client";
import { Category } from "@/types/category";
import { Combobox } from "@/components/ui/combobox";

interface CategoryFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    status?: CategoryStatus;
    description?: string | null;
    type?: CategoryType;
    parentId?: string | null;
    relatedCategories?: Category[];
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function CategoryForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: CategoryFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch all categories for parent and related category selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category/all-category");
        // Filter out current category if editing
        const availableCategories = data?.id
          ? response.data.filter((cat: Category) => cat.id !== data.id)
          : response.data;
        setCategories(availableCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [data?.id]);

  const form = useForm<categorySchemaType>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      type: data?.type || CategoryType.EXPENSE,
      status: data?.status || CategoryStatus.ACTIVE,
      parentId: data?.parentId || null,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: categorySchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/category", values);
        toast.success("Category created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/category/${data.id}`, values);
        toast.success("Category updated successfully");
      }

      form.reset();
      onSubmitSuccess?.();
      router.refresh();
      onCancel?.();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const formatLabel = (str: string) => {
    return str
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Category Name"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Category Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Description"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(CategoryType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLabel(type)}
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
          name="parentId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Parent Category (Optional)</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { label: "No Parent (Main Category)", value: "none" },
                    ...categories.map((cat) => ({
                      label: cat.name,
                      value: cat.id,
                    })),
                  ]}
                  value={field.value || "none"}
                  onChange={(value) => field.onChange(value === "none" ? null : value)}
                  isLoading={isLoadingCategories}
                  placeholder="Search parent category..."
                />
              </FormControl>
              <FormDescription>
                Select a category to make this a sub-category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                disabled={type === "create"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(CategoryStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create Category"
            ) : (
              "Update Category"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
