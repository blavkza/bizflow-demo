"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Loader2, Upload, X, ImageIcon, Pencil } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import {
  packageFormSchema,
  PackageFormValues,
} from "@/lib/formValidationSchemas";
import { Editor } from "@/components/ui/editor";
import { Separator } from "@/components/ui/separator";
import { DialogPackageData } from "@/types/package";
import { PackageType, PackageStatus } from "@prisma/client";

type ComboboxOption = {
  label: string;
  value: string;
  type?: string;
};

interface Category {
  id: string;
  name: string;
  type?: string;
}

const classifications = ["Class 1 A", "Class 1 B", "Class 2 A", "Class 2 B"];

// Ensure these match your form schema
const packageTypes = [
  { value: PackageType.BUNDLE, label: "Bundle (Products + Services)" },
  { value: PackageType.SERVICE_ONLY, label: "Service Only" },
  { value: PackageType.PRODUCT_ONLY, label: "Product Only" },
];

const statusOptions = [
  { value: PackageStatus.ACTIVE, label: "Active" },
  { value: PackageStatus.INACTIVE, label: "Inactive" },
  { value: PackageStatus.DRAFT, label: "Draft" },
  { value: PackageStatus.ARCHIVED, label: "Archived" },
];

interface PackageDialogProps {
  mode?: "create" | "edit";
  packageData?: DialogPackageData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function PackageDialog({
  mode = "create",
  packageData,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
  trigger,
}: PackageDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      notes: "",
      classification: "",
      category: "",
      packageType: PackageType.BUNDLE,
      status: PackageStatus.DRAFT,
      featured: false,
      isPublic: true,
      thumbnail: "",
      tags: "",
      benefits: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchCategories();

      if (mode === "edit" && packageData) {
        // Type-safe form reset with proper enum handling
        const formValues: PackageFormValues = {
          name: packageData.name || "",
          description: packageData.description || "",
          shortDescription: packageData.shortDescription || "",
          notes: packageData.notes || "",
          classification: packageData.classification || "",
          category: packageData.categoryId || "",
          packageType:
            (packageData.packageType as PackageType) || PackageType.BUNDLE,
          status: (packageData.status as PackageStatus) || PackageStatus.DRAFT,
          featured: packageData.featured || false,
          isPublic:
            packageData.isPublic !== undefined ? packageData.isPublic : true,
          thumbnail: packageData.thumbnail || "",
          tags: packageData.tags?.join(", ") || "",
          benefits: packageData.benefits?.join(", ") || "",
        };

        form.reset(formValues);

        // Set tags and benefits arrays
        setTags(packageData.tags || []);
        setBenefits(packageData.benefits || []);

        // Set preview image
        if (packageData.thumbnail) {
          setPreviewImage(packageData.thumbnail);
        } else if (packageData.images) {
          try {
            const images =
              typeof packageData.images === "string"
                ? JSON.parse(packageData.images)
                : packageData.images;
            if (images?.thumbnail) {
              setPreviewImage(images.thumbnail);
            }
          } catch (e) {
            console.error("Error parsing images:", e);
          }
        }
      } else {
        // Reset for create mode
        setPreviewImage(null);
        setTags([]);
        setBenefits([]);
        form.reset();
      }
    }
  }, [open, mode, packageData, form]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await axios.get("/api/category");
      const categories: Category[] =
        response?.data?.data || response?.data || [];
      const options = categories
        .filter((category) => category.id && category.name)
        .map((category) => ({
          label: category.name || "",
          value: category.id,
          type: category.type,
        }));
      setCategoriesOptions(options);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/packages/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPreviewImage(data.url);
      form.setValue("thumbnail", data.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
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
    form.setValue("thumbnail", "");
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addBenefit = () => {
    const trimmedBenefit = benefitInput.trim();
    if (trimmedBenefit && !benefits.includes(trimmedBenefit)) {
      setBenefits([...benefits, trimmedBenefit]);
      setBenefitInput("");
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setBenefits(benefits.filter((benefit) => benefit !== benefitToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "tag" | "benefit") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "tag") {
        addTag();
      } else {
        addBenefit();
      }
    }
  };

  async function onSubmit(values: PackageFormValues) {
    try {
      setLoading(true);

      const data = {
        ...values,
        tags,
        benefits,
        notes: values.notes || "",
        images: previewImage ? { thumbnail: previewImage } : null,
      };

      let response;
      if (mode === "edit" && packageData) {
        response = await axios.put(`/api/packages/${packageData.id}`, data);
        toast.success("Package updated successfully!", {
          description: `${values.name} has been updated.`,
        });
      } else {
        response = await axios.post("/api/packages", data);
        toast.success("Package created successfully!", {
          description: `${values.name} has been created.`,
        });
      }

      form.reset({
        name: "",
        description: "",
        shortDescription: "",
        notes: "",
        classification: "",
        category: "",
        packageType: PackageType.BUNDLE,
        status: PackageStatus.DRAFT,
        featured: false,
        isPublic: true,
        thumbnail: "",
        tags: "",
        benefits: "",
      });
      setTags([]);
      setBenefits([]);
      setPreviewImage(null);
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }

      router.refresh();
    } catch (error: any) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "creating"} package:`,
        error
      );
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} package`,
        {
          description: error.response?.data?.error || "Please try again.",
        }
      );
    } finally {
      setLoading(false);
    }
  }

  const getDialogTitle = () => {
    return mode === "edit" ? "Edit Package" : "Create New Package";
  };

  const getDialogDescription = () => {
    return mode === "edit"
      ? "Update package information and settings."
      : "Add a new product or service package to your catalog.";
  };

  const getSubmitButtonText = () => {
    if (loading) {
      return mode === "edit" ? "Updating..." : "Creating...";
    }
    return mode === "edit" ? "Update Package" : "Create Package";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === "edit" ? "outline" : "default"}>
            {mode === "edit" ? (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Package
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Package
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Startup Website Package"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description (max 200 characters)"
                            {...field}
                            value={field.value || ""}
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
                      <FormItem>
                        <FormLabel>Full Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed description of the package..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <div className="border rounded-md">
                            <Editor
                              placeholder="Add internal notes about this package..."
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Internal notes for team members (not visible to
                          customers)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select classification" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classifications.map((classification) => (
                            <SelectItem
                              key={classification}
                              value={classification}
                            >
                              {classification}
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading || isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {isLoadingCategories ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading categories...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select category" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesOptions.length > 0 ? (
                            categoriesOptions.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
                                {category.label}
                                {category.type && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({category.type})
                                  </span>
                                )}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No categories found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between">
                        <FormMessage />
                        {categoriesOptions.length === 0 &&
                          !isLoadingCategories && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0"
                              onClick={fetchCategories}
                            >
                              Retry
                            </Button>
                          )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {packageTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Draft packages are not visible to customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Tags</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (press Enter to add)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "tag")}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No tags added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Benefits</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a benefit (press Enter to add)"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "benefit")}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={addBenefit}
                      variant="outline"
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </div>
                  <ul className="space-y-2 min-h-[80px]">
                    {benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span>{benefit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(benefit)}
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                    {benefits.length === 0 && (
                      <li className="p-2 text-sm text-muted-foreground">
                        No benefits added yet
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Package Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a representative image for this package (optional)
                  </p>
                </div>

                {previewImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden border">
                      <Image
                        src={previewImage}
                        alt="Package preview"
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
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                        disabled={loading}
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
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="package-image-upload"
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                      disabled={uploading || loading}
                    />

                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium">
                          Uploading image...
                        </p>
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
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4" />
                          Select Image
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                          <FormDescription>
                            Show this package in featured sections
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public</FormLabel>
                          <FormDescription>
                            Make this package visible to customers
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isLoadingCategories}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  getSubmitButtonText()
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
