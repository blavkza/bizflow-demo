"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Loader2, Percent, Plus } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import { VendorForm } from "@/app/dashboard/suppliers/components/VendorForm";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TAX_RATE = 0.15; // 15% VAT for South Africa

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading = false,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [venders, setVendors] = useState<{ label: string; value: string }[]>(
    []
  );
  const [isloadingVender, setIsLoadingvender] = useState(false);

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
    product?.productDocuments?.map((doc) => ({
      url: doc.url,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      mimeType: doc.mimeType,
    })) || []
  );

  // Configuration Modes
  const [priceInputMode, setPriceInputMode] = useState<
    "BEFORE_TAX" | "AFTER_TAX"
  >(product?.priceInputMode || "AFTER_TAX");

  // Profit Mode: Percent (%) or Fixed Amount (R)
  const [profitInputMode, setProfitInputMode] = useState<"AMOUNT" | "PERCENT">(
    "PERCENT"
  );

  // Local state for the Profit Input field (visual only, truth is derived from Price - Cost)
  const [profitDisplayValue, setProfitDisplayValue] = useState<number>(0);

  // --- MATH UTILS ---
  const round = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;
  const addVat = (amount: number) => round(amount * (1 + TAX_RATE));
  const removeVat = (amount: number) => round(amount / (1 + TAX_RATE));

  // --- FORM SETUP ---
  const form = useForm<ShopProductSchemaType>({
    resolver: zodResolver(ShopProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      category: product?.category || "",
      stock: product?.stock || 0,
      minStock: product?.minStock || 0,
      maxStock: product?.maxStock || 0,
      weight: product?.weight || 0,
      dimensions: product?.dimensions || "",
      warranty: product?.warranty || "",
      color: product?.color || "",
      size: product?.size || "",
      brand: product?.brand || "",
      status: product?.status || "ACTIVE",
      featured: product?.featured !== undefined ? product.featured : true,
      images: product?.images || [],
      priceInputMode: product?.priceInputMode || "AFTER_TAX",
      venderId: product?.venderId || "",

      // Initialize Prices
      price: product?.price || 0,
      priceBeforeTax:
        product?.priceBeforeTax ||
        (product?.price ? removeVat(product.price) : 0),
      costPrice: product?.costPrice || null,
      costPriceBeforeTax:
        product?.costPriceBeforeTax ||
        (product?.costPrice ? removeVat(product.costPrice) : null),
    },
  });

  const { isSubmitting } = form.formState;
  const watchedValues = form.watch();

  // --- CALCULATION LOGIC ---

  // Helper: Get what the user is CURRENTLY seeing (based on mode)
  const getVisibleCost = (): number => {
    const vals = form.getValues();
    if (priceInputMode === "AFTER_TAX") {
      return vals.costPrice || 0;
    } else {
      return vals.costPriceBeforeTax || 0;
    }
  };

  const getVisiblePrice = (): number => {
    const vals = form.getValues();
    if (priceInputMode === "AFTER_TAX") {
      return vals.price || 0;
    } else {
      return vals.priceBeforeTax || 0;
    }
  };

  // Helper: Get ACTUAL values (always AFTER TAX) for profit calculations
  const getActualCost = (): number => {
    const vals = form.getValues();
    // Always return cost AFTER tax for profit calculations
    return vals.costPrice || 0;
  };

  const getActualPrice = (): number => {
    const vals = form.getValues();
    // Always return price AFTER tax for profit calculations
    return vals.price || 0;
  };

  /**
   * Sync Tax Fields:
   * If editing Inclusive, auto-calculate Exclusive (and vice versa).
   */
  const syncTaxFields = (
    baseValue: number,
    field: "price" | "cost",
    mode: "BEFORE_TAX" | "AFTER_TAX"
  ) => {
    if (mode === "AFTER_TAX") {
      // Input is Inclusive -> Calc Exclusive
      const excl = removeVat(baseValue);
      if (field === "price") {
        form.setValue("priceBeforeTax", excl, { shouldValidate: true });
      } else {
        form.setValue("costPriceBeforeTax", excl, { shouldValidate: true });
      }
    } else {
      // Input is Exclusive -> Calc Inclusive
      const incl = addVat(baseValue);
      if (field === "price") {
        form.setValue("price", incl, { shouldValidate: true });
      } else {
        form.setValue("costPrice", incl, { shouldValidate: true });
      }
    }
  };

  /**
   * Sync Profit Display:
   * Updates the visual profit input based on ACTUAL Cost vs Price (AFTER TAX).
   */
  const syncProfitDisplay = (cost: number, price: number) => {
    if (cost <= 0 || price <= 0) {
      setProfitDisplayValue(0);
      return;
    }

    const profitAmt = round(price - cost);

    if (profitInputMode === "PERCENT") {
      const margin = round((profitAmt / cost) * 100);
      setProfitDisplayValue(margin);
    } else {
      setProfitDisplayValue(profitAmt);
    }
  };


  const handleCostChange = (valStr: string) => {
    const newCost = parseFloat(valStr) || 0;

    // 1. Sync the other tax field
    syncTaxFields(newCost, "cost", priceInputMode);

    // 2. Calculate new Selling Price based on existing profit settings
    if (profitDisplayValue > 0 && newCost > 0) {
      let newPrice = 0;

      // Convert visible cost to actual cost for calculation
      const actualCost =
        priceInputMode === "AFTER_TAX" ? newCost : addVat(newCost);

      if (profitInputMode === "PERCENT") {
        newPrice = round(actualCost * (1 + profitDisplayValue / 100));
      } else {
        newPrice = round(actualCost + profitDisplayValue);
      }

      // 3. Update Price fields (visible values)
      if (priceInputMode === "AFTER_TAX") {
        form.setValue("price", newPrice, { shouldValidate: true });
        syncTaxFields(newPrice, "price", "AFTER_TAX");
      } else {
        const priceBeforeTax = removeVat(newPrice);
        form.setValue("priceBeforeTax", priceBeforeTax, {
          shouldValidate: true,
        });
        syncTaxFields(priceBeforeTax, "price", "BEFORE_TAX");
      }
    }

    // 4. Recalculate profit display using ACTUAL values
    const actualPrice = getActualPrice();
    const actualCost =
      priceInputMode === "AFTER_TAX" ? newCost : addVat(newCost);
    syncProfitDisplay(actualCost, actualPrice);
  };

 
  const handleSellingPriceChange = (valStr: string) => {
    const newPrice = parseFloat(valStr) || 0;

    // 1. Sync the other tax field
    syncTaxFields(newPrice, "price", priceInputMode);

    // 2. Recalculate Profit using ACTUAL values
    const actualCost = getActualCost();
    const actualPrice =
      priceInputMode === "AFTER_TAX" ? newPrice : addVat(newPrice);
    syncProfitDisplay(actualCost, actualPrice);
  };


  const handleProfitChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setProfitDisplayValue(val);

    const actualCost = getActualCost();
    if (actualCost <= 0) return;

    let newActualPrice = 0;
    if (profitInputMode === "PERCENT") {
      newActualPrice = round(actualCost * (1 + val / 100));
    } else {
      newActualPrice = round(actualCost + val);
    }

    if (priceInputMode === "AFTER_TAX") {
      form.setValue("price", newActualPrice, { shouldValidate: true });
      syncTaxFields(newActualPrice, "price", "AFTER_TAX");
    } else {
      const priceBeforeTax = removeVat(newActualPrice);
      form.setValue("priceBeforeTax", priceBeforeTax, { shouldValidate: true });
      syncTaxFields(priceBeforeTax, "price", "BEFORE_TAX");
    }
  };


  const toggleProfitMode = () => {
    const actualCost = getActualCost();
    const actualPrice = getActualPrice();

    if (actualCost <= 0 || actualPrice <= 0) {
      // Just toggle the mode if no cost or price
      setProfitInputMode(profitInputMode === "PERCENT" ? "AMOUNT" : "PERCENT");
      return;
    }

    const profitAmt = round(actualPrice - actualCost);

    if (profitInputMode === "PERCENT") {
      // Switching from % to R
      setProfitDisplayValue(profitAmt);
      setProfitInputMode("AMOUNT");
    } else {
      // Switching from R to %
      const calculatedPercentage = round((profitAmt / actualCost) * 100);
      setProfitDisplayValue(calculatedPercentage);
      setProfitInputMode("PERCENT");
    }
  };

 
  const handleInputModeChange = (checked: boolean) => {
    const newMode = checked ? "AFTER_TAX" : "BEFORE_TAX";

    if (newMode === priceInputMode) return;

    // Get what the user CURRENTLY sees
    const currentVisibleCost = getVisibleCost();
    const currentVisiblePrice = getVisiblePrice();
    const hasCost = currentVisibleCost > 0;

    // Update mode
    setPriceInputMode(newMode);
    form.setValue("priceInputMode", newMode);

    if (newMode === "AFTER_TAX") {
      // Switching TO After Tax
      // User wants to see currentVisiblePrice as AFTER tax
      form.setValue("price", currentVisiblePrice, { shouldValidate: true });
      form.setValue("priceBeforeTax", removeVat(currentVisiblePrice), {
        shouldValidate: true,
      });

      if (hasCost) {
        form.setValue("costPrice", currentVisibleCost, {
          shouldValidate: true,
        });
        form.setValue("costPriceBeforeTax", removeVat(currentVisibleCost), {
          shouldValidate: true,
        });
      } else {
        form.setValue("costPrice", null, { shouldValidate: true });
        form.setValue("costPriceBeforeTax", null, { shouldValidate: true });
      }
    } else {
      // Switching TO Before Tax
      // User wants to see currentVisiblePrice as BEFORE tax
      form.setValue("priceBeforeTax", currentVisiblePrice, {
        shouldValidate: true,
      });
      form.setValue("price", addVat(currentVisiblePrice), {
        shouldValidate: true,
      });

      if (hasCost) {
        form.setValue("costPriceBeforeTax", currentVisibleCost, {
          shouldValidate: true,
        });
        form.setValue("costPrice", addVat(currentVisibleCost), {
          shouldValidate: true,
        });
      } else {
        form.setValue("costPriceBeforeTax", null, { shouldValidate: true });
        form.setValue("costPrice", null, { shouldValidate: true });
      }
    }

    // Profit margin should NOT change - it's based on actual (after tax) values
    // No need to recalculate profit display
  };

  // --- LIFECYCLE ---
  useEffect(() => {
    loadCategories();
    loadVendors();

    // Initialize profit display based on ACTUAL values (after tax)
    if (product) {
      const cost = product.costPrice || 0;
      const price = product.price || 0;

      if (cost > 0 && price > 0) {
        syncProfitDisplay(cost, price);
      }
    }
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

  const loadVendors = async () => {
    try {
      setIsLoadingvender(true);
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        setVendors(
          data.map((vendor: any) => ({
            label: vendor.name,
            value: vendor.id,
          }))
        );
      }
      setIsLoadingvender(false);
    } catch (error) {
      console.error("Failed to load vendors:", error);
    }
  };

  const refreshVendors = async () => {
    try {
      setIsLoadingvender(true);
      const response = await axios.get("/api/vendors");
      setVendors(
        response.data.map((vendor: any) => ({
          label: vendor.name,
          value: vendor.id,
        }))
      );
      setIsLoadingvender(false);
    } catch (error) {
      console.error("Error refreshing vendors:", error);
    }
  };

  // --- DISPLAY VALUES (Summary Table) - FIXED ---
  const displayValues = useMemo(() => {
    // Get actual values (after tax) for profit calculations
    const sellingAfterTax = form.getValues().price || 0;
    const sellingBeforeTax = form.getValues().priceBeforeTax || 0;
    const costAfterTax = form.getValues().costPrice || 0;
    const costBeforeTax = form.getValues().costPriceBeforeTax || 0;

    // Calculate profit based on AFTER TAX values (actual money)
    const profitAmount = round(sellingAfterTax - costAfterTax);
    const profitPercent =
      costAfterTax > 0 ? round((profitAmount / costAfterTax) * 100) : 0;

    const markup = costAfterTax > 0 ? round(sellingAfterTax / costAfterTax) : 0;

    return {
      sellingPriceBeforeTax: round(sellingBeforeTax),
      sellingPriceAfterTax: round(sellingAfterTax),
      vatAmount: round(sellingAfterTax - sellingBeforeTax),

      costBeforeTax: round(costBeforeTax),
      costAfterTax: round(costAfterTax),
      costVatAmount: round(costAfterTax - costBeforeTax),

      // Profit is always based on AFTER TAX values (actual money)
      profitAmount,
      profitPercent,
      markup,
    };
  }, [
    watchedValues.price,
    watchedValues.priceBeforeTax,
    watchedValues.costPrice,
    watchedValues.costPriceBeforeTax,
  ]);

  // --- FILE HANDLERS ---
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
        name: values.name,
        description: values.description,
        sku: values.sku,
        category: values.category,
        price: Number(values.price) || 0,
        priceBeforeTax: Number(values.priceBeforeTax) || 0,
        costPrice: values.costPrice ? Number(values.costPrice) : null,
        costPriceBeforeTax: values.costPriceBeforeTax
          ? Number(values.costPriceBeforeTax)
          : null,
        priceInputMode: values.priceInputMode,
        stock: Number(values.stock),
        minStock: Number(values.minStock),
        maxStock: Number(values.maxStock),
        weight: Number(values.weight),
        dimensions: values.dimensions,
        warranty: values.warranty,
        color: values.color,
        size: values.size,
        brand: values.brand,
        status: values.status,
        featured: values.featured,
        images: images.map((img) => img.url),
        venderId: values.venderId || null,
        documents: documents.map((doc) => ({
          url: doc.url,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          mimeType: doc.mimeType,
        })),
      };

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

  // Format Helper
  const formatPrice = (val: number) => {
    if (val === null || val === undefined) return "0.00";
    return val.toFixed(2);
  };

  const getProfitInfoText = () => {
    const cost = getActualCost();
    const price = getActualPrice();

    if (cost <= 0 || price <= 0) return "-";

    const profitAmt = round(price - cost);

    if (profitInputMode === "PERCENT") {
      // Already showing percentage, show amount
      return `Amount: R${formatPrice(profitAmt)}`;
    } else {
      // Showing amount, show percentage
      const pct = round((profitAmt / cost) * 100);
      return `Percentage: ${pct}%`;
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

          {/* Vendor Field */}
          <FormField
            control={form.control}
            name="venderId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Vendor/ Supplier</FormLabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Combobox
                      options={venders}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select vendor"
                      isLoading={isloadingVender}
                    />
                  </div>
                  <AddVendorDialog onVendorAdded={refreshVendors} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pricing Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800">
            <div>
              <h3 className="font-medium">Price Input Mode</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-300">
                Choose whether to enter prices before or after 15% VAT
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`text-sm ${priceInputMode === "BEFORE_TAX" ? "font-semibold" : ""}`}
              >
                Before Tax
              </span>
              <Switch
                checked={priceInputMode === "AFTER_TAX"}
                onCheckedChange={handleInputModeChange}
              />
              <span
                className={`text-sm ${priceInputMode === "AFTER_TAX" ? "font-semibold" : ""}`}
              >
                After Tax
              </span>
            </div>
          </div>

          {/* Dynamic Pricing Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {priceInputMode === "AFTER_TAX" ? (
                // AFTER TAX MODE (Inc VAT)
                <>
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (after VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange(null);
                                  form.setValue("costPriceBeforeTax", null);
                                } else {
                                  field.onChange(parseFloat(val));
                                  handleCostChange(val);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `Ex VAT: R${formatPrice(removeVat(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input (Shared UI structure) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">
                        Profit Margin
                      </FormLabel>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">%</span>
                        <Switch
                          checked={profitInputMode === "AMOUNT"}
                          onCheckedChange={toggleProfitMode}
                          className="scale-75"
                        />
                        <span className="text-xs text-gray-600">R</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        {profitInputMode === "PERCENT" ? (
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="absolute left-3 top-2.5 h-4 w-4 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            R
                          </span>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={
                            profitDisplayValue === 0 ? "" : profitDisplayValue
                          }
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {getProfitInfoText()}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (after VAT) *</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal = val === "" ? 0 : parseFloat(val);
                                field.onChange(isNaN(numVal) ? 0 : numVal);
                                handleSellingPriceChange(val);
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Ex VAT: R
                              {formatPrice(removeVat(field.value || 0))}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                // BEFORE TAX MODE (Ex VAT)
                <>
                  <FormField
                    control={form.control}
                    name="costPriceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Cost Price (before VAT)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange(null);
                                  form.setValue("costPrice", null);
                                } else {
                                  field.onChange(parseFloat(val));
                                  handleCostChange(val);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              {field.value !== null
                                ? `Inc VAT: R${formatPrice(addVat(field.value))}`
                                : ""}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit Input (Shared UI structure) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">
                        Profit Margin
                      </FormLabel>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">%</span>
                        <Switch
                          checked={profitInputMode === "AMOUNT"}
                          onCheckedChange={toggleProfitMode}
                          className="scale-75"
                        />
                        <span className="text-xs text-gray-600">R</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        {profitInputMode === "PERCENT" ? (
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="absolute left-3 top-2.5 h-4 w-4 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            R
                          </span>
                        )}
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={
                            profitDisplayValue === 0 ? "" : profitDisplayValue
                          }
                          onChange={(e) => handleProfitChange(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {getProfitInfoText()}
                      </p>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <FormField
                    control={form.control}
                    name="priceBeforeTax"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Selling Price (before VAT) *</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal = val === "" ? 0 : parseFloat(val);
                                field.onChange(isNaN(numVal) ? 0 : numVal);
                                handleSellingPriceChange(val);
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Inc VAT: R{formatPrice(addVat(field.value || 0))}
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>

          {/* Tax Summary - NOW DYNAMIC */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-zinc-800">
            <h4 className="font-medium text-sm mb-2">15% VAT Summary</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Cost Price</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      Cost before VAT:
                    </p>
                    <p className="font-semibold">
                      {displayValues.costBeforeTax > 0
                        ? `R${formatPrice(displayValues.costBeforeTax)}`
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      VAT amount (15%):
                    </p>
                    <p className="font-semibold">
                      {displayValues.costBeforeTax > 0
                        ? `R${formatPrice(displayValues.costVatAmount)}`
                        : "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-zinc-500">
                      Cost after VAT:
                    </p>
                    <p className="font-semibold text-lg">
                      {displayValues.costAfterTax > 0
                        ? `R${formatPrice(displayValues.costAfterTax)}`
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Selling Price</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      Price before VAT:
                    </p>
                    <p className="font-semibold">
                      R{formatPrice(displayValues.sellingPriceBeforeTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      VAT amount (15%):
                    </p>
                    <p className="font-semibold">
                      R{formatPrice(displayValues.vatAmount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-zinc-500">
                      Price after VAT:
                    </p>
                    <p className="font-semibold text-lg">
                      R{formatPrice(displayValues.sellingPriceAfterTax)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Summary - Based on ACTUAL values (after tax) */}
            {(displayValues.costAfterTax > 0 ||
              displayValues.profitAmount > 0) && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium">Profit Summary</h5>
                <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      Profit amount:
                    </p>
                    <p className="font-semibold text-green-600">
                      R{formatPrice(displayValues.profitAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">
                      Profit percentage:
                    </p>
                    <p className="font-semibold text-green-600">
                      {displayValues.profitPercent > 0
                        ? displayValues.profitPercent.toFixed(1) + "%"
                        : "0%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-zinc-500">Markup:</p>
                    <p className="font-semibold text-green-600">
                      {displayValues.markup > 0
                        ? displayValues.markup.toFixed(2) + "x"
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                    <Input
                      type="number"
                      placeholder="0"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === "" ? 0 : parseInt(val);
                        field.onChange(isNaN(numVal) ? 0 : numVal);
                      }}
                    />
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
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === "" ? 0 : parseInt(val);
                        field.onChange(isNaN(numVal) ? 0 : numVal);
                      }}
                    />
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
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === "" ? 0 : parseInt(val);
                        field.onChange(isNaN(numVal) ? 0 : numVal);
                      }}
                    />
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
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === "" ? 0 : parseFloat(val);
                        field.onChange(isNaN(numVal) ? 0 : numVal);
                      }}
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
          <div className="grid grid-cols-2 gap-4">
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
            {/* warranty */}
            <FormField
              control={form.control}
              name="warranty"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Warranty</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 4 weeks or 6 months" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                <FormItem className="flex items-center space-x-3 pt-8">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Avalable Online</FormLabel>
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

// Add Vendor Dialog Component
function AddVendorDialog({ onVendorAdded }: { onVendorAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);

    try {
      const apiData = {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim(),
        phone2: data.phone2?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        taxNumber: data.taxNumber?.trim() || null,
        registrationNumber: data.registrationNumber?.trim() || null,
        categoryIds: data.categoryIds || [],
        type: data.type || "SUPPLIER",
        status: data.status || "ACTIVE",
        paymentTerms:
          data.paymentTerms === "no-payment-terms"
            ? null
            : data.paymentTerms?.trim(),
        notes: data.notes?.trim() || null,
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create vendor");
      }

      await response.json();
      toast.success("Vendor created successfully");
      setIsOpen(false);
      onVendorAdded();
    } catch (error) {
      console.error("Failed to create vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create vendor"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="h-3 w-3 mr-1" />
          New Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Add a new vendor or supplier to your system.
          </DialogDescription>
        </DialogHeader>

        <VendorForm onSubmit={handleSubmit} loading={loading} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
