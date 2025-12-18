"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, KeyboardEvent } from "react";
import {
  PAYMENT_TERMS,
  NO_PAYMENT_TERMS_VALUE,
  vendorFormSchema,
} from "../utils";
import { VendorFormData, VendorType } from "../type";
import { VendorStatus } from "@prisma/client";

interface VendorFormProps {
  onSubmit: (data: VendorFormData) => Promise<void>;
  loading: boolean;
  defaultValues?: VendorFormData;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
}

export function VendorForm({
  onSubmit,
  loading,
  defaultValues,
}: VendorFormProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const commandListRef = useRef<HTMLDivElement>(null);
  const commandItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      phone2: "",
      website: "",
      address: "",
      taxNumber: "",
      registrationNumber: "",
      categoryIds: [],
      type: VendorType.SUPPLIER,
      status: VendorStatus.ACTIVE,
      paymentTerms: NO_PAYMENT_TERMS_VALUE,
      notes: "",
    },
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch("/api/shop/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getDisplayValue = (value: string) => {
    if (value === NO_PAYMENT_TERMS_VALUE) return "No specific terms";
    return value;
  };

  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open || categories.length === 0) return;

    const totalItems = categories.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
          handleSelectCategory(categories[highlightedIndex]);
        }
        break;

      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;

      case "Tab":
        setOpen(false);
        break;
    }
  };

  const handleSelectCategory = (category: ProductCategory) => {
    const currentIds = form.getValues("categoryIds") || [];
    const isSelected = currentIds.includes(category.id);
    const newIds = isSelected
      ? currentIds.filter((id) => id !== category.id)
      : [...currentIds, category.id];

    form.setValue("categoryIds", newIds, { shouldValidate: true });

    // Reset highlighted index
    setHighlightedIndex(-1);
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && commandListRef.current) {
      const category = categories[highlightedIndex];
      const itemElement = commandItemsRef.current.get(category.id);
      if (itemElement) {
        itemElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, categories]);

  // Reset highlighted index when categories change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [categories]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Vendor name"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vendor@example.com"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+27 12 345 6789"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter secondary phone"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Full address"
                    rows={3}
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tax/VAT number"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter registration number"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(VendorType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatEnumValue(type)}
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
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(VendorStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatEnumValue(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Multiple Categories Selection */}
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selectedIds = field.value || [];
                const selectedCategories = categories.filter((cat) =>
                  selectedIds.includes(cat.id)
                );

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Categories (Suppliers / provide with)</FormLabel>
                    <Popover
                      open={open}
                      onOpenChange={(isOpen) => {
                        setOpen(isOpen);
                        if (!isOpen) {
                          setHighlightedIndex(-1);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                            disabled={loading || categoriesLoading}
                          >
                            {categoriesLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading categories...
                              </>
                            ) : selectedCategories.length > 0 ? (
                              `${selectedCategories.length} category${
                                selectedCategories.length !== 1 ? "ies" : "y"
                              } selected`
                            ) : (
                              "Select categories..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0"
                        onKeyDown={handleKeyDown}
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search categories..."
                            onKeyDown={(e) => {
                              if (
                                ["ArrowUp", "ArrowDown", "Enter"].includes(
                                  e.key
                                )
                              ) {
                                e.preventDefault();
                              }
                            }}
                          />
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup
                            className="max-h-64 overflow-y-auto"
                            ref={commandListRef}
                          >
                            {categories.map((category, index) => {
                              const isSelected = selectedIds.includes(
                                category.id
                              );
                              const isHighlighted = index === highlightedIndex;

                              return (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() =>
                                    handleSelectCategory(category)
                                  }
                                  ref={(el) => {
                                    if (el) {
                                      commandItemsRef.current.set(
                                        category.id,
                                        el
                                      );
                                    } else {
                                      commandItemsRef.current.delete(
                                        category.id
                                      );
                                    }
                                  }}
                                  className={cn(
                                    "cursor-pointer",
                                    isHighlighted && "bg-accent",
                                    isSelected && "font-medium"
                                  )}
                                  onMouseEnter={() =>
                                    setHighlightedIndex(index)
                                  }
                                >
                                  <div className="flex items-center">
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{category.name}</span>
                                      {category.description && (
                                        <span className="text-xs text-muted-foreground">
                                          {category.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedCategories.map((category) => (
                          <div
                            key={category.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
                          >
                            {category.name}
                            <button
                              type="button"
                              onClick={() => {
                                const newIds = selectedIds.filter(
                                  (id) => id !== category.id
                                );
                                field.onChange(newIds);
                              }}
                              className="ml-1 rounded-full hover:bg-primary/20 p-1"
                              disabled={loading}
                              aria-label={`Remove ${category.name}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Tip: Use ↑ ↓ arrows to navigate, Enter to select, Esc to
                      close
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {getDisplayValue(field.value)}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PAYMENT_TERMS_VALUE}>
                        No specific terms
                      </SelectItem>
                      {PAYMENT_TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes..."
                    rows={3}
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {defaultValues ? "Updating..." : "Adding..."}
            </>
          ) : defaultValues ? (
            "Update Vendor"
          ) : (
            "Add Vendor"
          )}
        </Button>
      </form>
    </Form>
  );
}
