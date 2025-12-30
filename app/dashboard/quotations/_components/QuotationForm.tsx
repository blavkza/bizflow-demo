"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Loader2,
  Plus,
  X,
  Calculator,
  FileText,
  Search,
  Briefcase,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Replaced Textarea with Editor
import { Editor } from "@/components/ui/editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import ClientForm from "../../human-resources/clients/_components/client-Form";
import { QuotationSchema } from "@/lib/formValidationSchemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QuotationWithRelations } from "@/types/quotation";
import { Client, ShopProduct, Service } from "@prisma/client";

// --- Types & Helpers ---

type SearchableItem = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  category?: string;
  duration?: string;
  features?: string[];
  description?: string | null;
  sku?: string;
  image?: string | null;
};

interface QuotationFormProps {
  type: "create" | "update";
  onCancel: () => void;
  onSubmitSuccess: () => void;
  data?: QuotationWithRelations;
  quotationId?: string;
}

interface CalculationSummary {
  subtotal: number;
  totalTax: number;
  taxableAmount: number;
  discountAmount: number;
  depositAmount: number;
  totalAmount: number;
  amountDue: number;
  itemDiscounts: number[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
};

const safeNumber = (val: any) => (val ? Number(val) : 0);

interface SearchableItemInputProps {
  index: number;
  searchTerm: string;
  searchableItems: SearchableItem[];
  showDropdown: number | null;
  onSearchChange: (index: number, value: string) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onSelect: (index: number, item: SearchableItem) => void;
  setShowDropdown: (index: number | null) => void;
}

const SearchableItemInput = ({
  index,
  searchTerm,
  searchableItems,
  showDropdown,
  onSearchChange,
  onFocus,
  onBlur,
  onSelect,
  setShowDropdown,
}: SearchableItemInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Helper function to extract text from HTML
  const extractTextFromHTML = (html: string | null | undefined): string => {
    if (!html) return "";

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Get text content and remove extra whitespace
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const filteredItems = searchableItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(searchLower);
    const matchesSku = item.sku?.toLowerCase().includes(searchLower) || false;
    const matchesCategory =
      item.category?.toLowerCase().includes(searchLower) || false;

    // Extract text from HTML description for searching
    const descriptionText = extractTextFromHTML(item.description);
    const matchesDescription = descriptionText
      .toLowerCase()
      .includes(searchLower);

    return matchesName || matchesSku || matchesDescription || matchesCategory;
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown !== index) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          onSelect(index, filteredItems[selectedIndex]);
          setSelectedIndex(-1);
        }
        break;

      case "Escape":
        setSelectedIndex(-1);
        setShowDropdown(null);
        break;
    }
  };

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          placeholder="Search products/services by name, SKU, description, or category..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(index, e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            onFocus(index);
            setSelectedIndex(-1);
          }}
          onBlur={() => {
            setTimeout(() => {
              onBlur();
              setSelectedIndex(-1);
            }, 200);
          }}
        />
      </div>

      {showDropdown === index && filteredItems.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md max-h-96 overflow-auto">
          <div className="p-1">
            {filteredItems.slice(0, 10).map((item, itemIndex) => {
              const descriptionText = extractTextFromHTML(item.description);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "flex items-start p-2 hover:bg-accent rounded-sm cursor-pointer border-b last:border-0 gap-3",
                    selectedIndex === itemIndex && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(index, item);
                    setSelectedIndex(-1);
                  }}
                >
                  {/* Image thumbnail */}
                  {item.image && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {!item.image && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                      <div className="text-muted-foreground">
                        {item.type === "product" ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {item.name}
                        </span>
                        {item.sku && (
                          <span className="text-[10px] font-mono bg-muted px-1 rounded mt-0.5 inline-block">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>
                        {item.type === "product" ? "Product" : "Service"}
                        {item.category && ` • ${item.category}`}
                      </span>
                      {item.duration && <span>{item.duration}</span>}
                    </div>

                    {descriptionText && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {descriptionText}
                      </div>
                    )}

                    {item.features && item.features.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1 italic truncate">
                        • Includes: {item.features.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
// --- Main Component ---

export function QuotationForm({
  type,
  onCancel,
  onSubmitSuccess,
  data,
  quotationId,
}: QuotationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clientsOptions, setClientsOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [calculations, setCalculations] = useState<CalculationSummary>({
    subtotal: 0,
    totalTax: 0,
    taxableAmount: 0,
    discountAmount: 0,
    depositAmount: 0,
    totalAmount: 0,
    amountDue: 0,
    itemDiscounts: [],
  });

  const [searchInputs, setSearchInputs] = useState<{ [key: number]: string }>(
    {}
  );
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  // Initial deposit calculation for Edit Mode
  let depositAmount = 0;
  if (data?.depositType === "PERCENTAGE" && data?.depositAmount) {
    depositAmount = Number(data?.depositRate || 0);
  } else {
    depositAmount = Number(data?.depositAmount || 0);
  }

  const form = useForm<z.infer<typeof QuotationSchema>>({
    resolver: zodResolver(QuotationSchema),
    defaultValues: {
      clientId: data?.clientId || "",
      title: data?.title || "",
      issueDate: data?.issueDate
        ? new Date(data.issueDate).toISOString()
        : new Date().toISOString(),
      validUntil: data?.validUntil
        ? new Date(data.validUntil).toISOString()
        : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      items:
        Array.isArray(data?.items) && data.items.length > 0
          ? data.items.map((item) => ({
              description: item.description || "",
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              taxRate: Number(item.taxRate),
              shopProductId: item.shopProductId || undefined,
              serviceId: item.serviceId || undefined,
              itemDiscountType: (item as any).itemDiscountType || undefined,
              itemDiscountAmount: (item as any).itemDiscountAmount
                ? Number((item as any).itemDiscountAmount)
                : 0,
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 0,
                shopProductId: undefined,
                serviceId: undefined,
                itemDiscountType: undefined,
                itemDiscountAmount: 0,
              },
            ],
      discountType: data?.discountType || undefined,
      discountAmount: data?.discountAmount
        ? Number(data?.discountAmount)
        : undefined,
      depositRequired: data?.depositRequired || false,
      depositType: data?.depositType || "PERCENTAGE",
      depositAmount: data?.depositAmount ? depositAmount : 30,
      description: data?.description || "",
      paymentTerms: data?.paymentTerms || "",
      notes: data?.notes || "",
    },
  });

  // Initialize search inputs
  useEffect(() => {
    const initialSearchInputs: { [key: number]: string } = {};
    form.getValues("items").forEach((item, index) => {
      initialSearchInputs[index] = item.description || "";
    });
    setSearchInputs(initialSearchInputs);
  }, [form]);

  // --- CALCULATION LOGIC ---
  const calculateTotals = () => {
    const items = form.getValues("items");
    const discountType = form.getValues("discountType");
    const discountAmountInput = safeNumber(form.getValues("discountAmount"));
    const depositRequired = form.getValues("depositRequired");
    const depositType = form.getValues("depositType");
    const depositAmountInput = safeNumber(form.getValues("depositAmount"));

    // PASS 1: Calculate Net Amounts per Item
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const itemData = items.map((item) => {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const itemDiscountInput = safeNumber(item.itemDiscountAmount);

      const baseAmount = quantity * unitPrice;

      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (itemDiscountInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountMoney = itemDiscountInput;
      }

      itemDiscountMoney = Math.min(itemDiscountMoney, baseAmount);
      const netAmount = baseAmount - itemDiscountMoney;

      subtotalGross += baseAmount;
      totalItemDiscountMoney += itemDiscountMoney;

      return {
        baseAmount,
        itemDiscountMoney,
        netAmount,
        taxRate,
      };
    });

    // PASS 2: Calculate Global Discount Money
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;

    let globalDiscountMoney = 0;
    if (discountType === "PERCENTAGE") {
      globalDiscountMoney =
        subtotalAfterItemDiscounts * (discountAmountInput / 100);
    } else if (discountType === "AMOUNT") {
      globalDiscountMoney = discountAmountInput;
    }

    globalDiscountMoney = Math.min(
      globalDiscountMoney,
      subtotalAfterItemDiscounts
    );

    // PASS 3: Calculate Taxable Amount and Total Tax
    let totalTax = 0;

    itemData.forEach((item) => {
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;

      const allocatedGlobalDiscount = globalDiscountMoney * ratio;

      // Final Taxable Amount for this item
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;

      const taxAmount = (finalTaxableAmount * item.taxRate) / 100;

      totalTax += taxAmount;
    });

    // Final Totals
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney;
    const totalAmount = finalSubtotal + totalTax;

    // PASS 4: Deposit
    let calculatedDeposit = 0;
    if (depositRequired) {
      if (depositType === "PERCENTAGE") {
        calculatedDeposit = totalAmount * (depositAmountInput / 100);
      } else if (depositType === "AMOUNT") {
        calculatedDeposit = depositAmountInput;
      }
      calculatedDeposit = Math.min(calculatedDeposit, totalAmount);
    }

    const amountDue = totalAmount - calculatedDeposit;

    setCalculations({
      subtotal: subtotalGross,
      totalTax,
      taxableAmount: finalSubtotal,
      discountAmount: globalDiscountMoney + totalItemDiscountMoney,
      depositAmount: calculatedDeposit,
      totalAmount,
      amountDue,
      itemDiscounts: itemData.map((i) => i.itemDiscountMoney),
    });
  };

  useEffect(() => {
    calculateTotals();
  }, [
    form.watch("items"),
    form.watch("discountType"),
    form.watch("discountAmount"),
    form.watch("depositRequired"),
    form.watch("depositType"),
    form.watch("depositAmount"),
  ]);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients
        .filter((client) => client.id && client.name)
        .map((client) => ({
          label: client.name || "",
          value: client.id,
        }));
      setClientsOptions(options);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/general");
      const { data } = await response.json();

      const defaultSetting = data;
      if (type === "create" && defaultSetting) {
        form.setValue("paymentTerms", defaultSetting.paymentTerms || "");
        form.setValue("notes", defaultSetting.note || "");
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch settings", error);
      return null;
    }
  };

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const [productsResponse, servicesResponse] = await Promise.all([
        axios.get("/api/shop/products"),
        axios.get("/api/services"),
      ]);

      const products: ShopProduct[] = productsResponse?.data || [];
      const services: Service[] = servicesResponse?.data || [];

      const combinedItems: SearchableItem[] = [
        ...products.map((product) => {
          let firstImage: string | undefined;

          if (product.images) {
            try {
              const imagesData =
                typeof product.images === "string"
                  ? JSON.parse(product.images)
                  : product.images;

              if (Array.isArray(imagesData) && imagesData.length > 0) {
                if (typeof imagesData[0] === "string") {
                  firstImage = imagesData[0];
                } else if (
                  imagesData[0] &&
                  typeof imagesData[0] === "object" &&
                  imagesData[0].url
                ) {
                  firstImage = imagesData[0].url;
                }
              }
            } catch (error) {
              console.warn("Error parsing images:", error);
            }
          }

          return {
            id: product.id,
            name: product.name,
            type: "product" as const,
            price: Number(product.price || 0),
            category: product.category,
            sku: product.sku,
            description: product.description,
            image: firstImage,
          };
        }),
        ...services.map((service) => ({
          id: service.id,
          name: service.name,
          type: "service" as const,
          price: Number(service.amount || 0),
          category: service.category,
          duration: service.duration || undefined,
          features: service.features || [],
          description: service.description || undefined,
        })),
      ];

      setSearchableItems(combinedItems);
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error("Failed to load products and services");
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchItems();
    fetchSettings();
  }, []);

  const handleSearchInputChange = (index: number, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));
    form.setValue(`items.${index}.description`, value);

    if (value === "") {
      form.setValue(`items.${index}.shopProductId`, undefined);
      form.setValue(`items.${index}.serviceId`, undefined);
      form.setValue(`items.${index}.itemDiscountType`, undefined);
      form.setValue(`items.${index}.itemDiscountAmount`, 0);
    }

    if (value.length > 0) {
      setShowDropdown(index);
    } else {
      setShowDropdown(null);
    }
  };

  const handleItemSelect = (index: number, item: SearchableItem) => {
    let description = `${item.name}`;

    if (item.sku) {
      description = `${description} [${item.sku}]`;
    }

    if (item.category) {
      description += ` - ${item.category}`;
    }
    if (item.duration) {
      description += ` (${item.duration})`;
    }

    if (item.description) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = item.description;
      const plainDescription = tempDiv.textContent || tempDiv.innerText || "";
      if (plainDescription) {
        description += `\n${plainDescription}`;
      }
    }

    if (item.type === "service" && item.features && item.features.length > 0) {
      description += `\nIncludes: ${item.features.join(", ")}`;
    }

    setSearchInputs((prev) => ({ ...prev, [index]: description }));
    form.setValue(`items.${index}.description`, description);
    form.setValue(`items.${index}.unitPrice`, item.price);
    form.setValue(`items.${index}.taxRate`, 15);
    form.setValue(`items.${index}.itemDiscountType`, undefined);
    form.setValue(`items.${index}.itemDiscountAmount`, 0);

    if (item.type === "product") {
      form.setValue(`items.${index}.shopProductId`, item.id);
      form.setValue(`items.${index}.serviceId`, undefined);
    } else {
      form.setValue(`items.${index}.serviceId`, item.id);
      form.setValue(`items.${index}.shopProductId`, undefined);
    }

    setShowDropdown(null);
    setTimeout(calculateTotals, 0);
  };

  const handleSearchFocus = (index: number) => {
    const currentValue = searchInputs[index] || "";
    if (currentValue.length > 0) {
      setShowDropdown(index);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowDropdown(null);
    }, 200);
  };

  const onSubmit = async (values: z.infer<typeof QuotationSchema>) => {
    setIsLoading(true);
    try {
      const itemsWithProductIds = values.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        // Handle optional fields correctly
        shopProductId: item.shopProductId || undefined,
        serviceId: item.serviceId || undefined,
        itemDiscountType: item.itemDiscountType || undefined,
        itemDiscountAmount: item.itemDiscountAmount || 0,
      }));

      const quotationData = {
        ...values,
        discountType: values.discountType || undefined,
        items: itemsWithProductIds,
      };

      const method = type === "create" ? "POST" : "PUT";
      const url =
        type === "create"
          ? "/api/quotations"
          : `/api/quotations/${quotationId}`;

      await axios({
        method,
        url,
        data: quotationData,
      });

      toast.success(
        `Quotation ${type === "create" ? "created" : "updated"} successfully`
      );
      onSubmitSuccess();
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        description:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    const newIndex = currentItems.length;

    form.setValue("items", [
      ...currentItems,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        shopProductId: undefined,
        serviceId: undefined,
        itemDiscountType: undefined,
        itemDiscountAmount: 0,
      },
    ]);

    setSearchInputs((prev) => ({ ...prev, [newIndex]: "" }));
    setTimeout(calculateTotals, 0);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue(
        "items",
        items.filter((_, i) => i !== index)
      );
      setSearchInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[index];
        return newInputs;
      });
      setTimeout(calculateTotals, 0);
    }
  };

  // --- Input Handlers ---

  const handleQuantityChange = (index: number, value: number) => {
    form.setValue(`items.${index}.quantity`, value);
    calculateTotals();
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    form.setValue(`items.${index}.unitPrice`, value);
    calculateTotals();
  };

  const handleTaxRateChange = (index: number, value: number) => {
    form.setValue(`items.${index}.taxRate`, value);
    calculateTotals();
  };

  const handleItemDiscountChange = (
    index: number,
    type: "AMOUNT" | "PERCENTAGE" | undefined,
    amount: number
  ) => {
    form.setValue(`items.${index}.itemDiscountType`, type);
    form.setValue(`items.${index}.itemDiscountAmount`, amount);
    calculateTotals();
  };

  const handleDiscountChange = (
    type: "AMOUNT" | "PERCENTAGE" | undefined,
    amount: number
  ) => {
    form.setValue("discountType", type);
    if (amount !== undefined) {
      form.setValue("discountAmount", amount);
    }
    calculateTotals();
  };

  const handleDepositChange = (
    required: boolean,
    type: "AMOUNT" | "PERCENTAGE",
    amount: number
  ) => {
    form.setValue("depositRequired", required);
    form.setValue("depositType", type);
    if (amount !== undefined) {
      form.setValue("depositAmount", amount);
    }
    calculateTotals();
  };

  const handleDateSelect = (
    fieldName: "issueDate" | "validUntil",
    date: Date | undefined
  ) => {
    if (date) {
      form.setValue(fieldName, date.toISOString());
    }
  };

  const getRowNetTotal = (index: number) => {
    const item = form.getValues(`items.${index}`);
    const qty = safeNumber(item.quantity);
    const price = safeNumber(item.unitPrice);
    const taxRate = safeNumber(item.taxRate);
    const discInput = safeNumber(item.itemDiscountAmount);

    const base = qty * price;
    let disc = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      disc = base * (discInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      disc = discInput;
    }
    const net = Math.max(0, base - disc);

    const tax = net * (taxRate / 100);
    return net + tax;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">
                {type === "create"
                  ? "Create a new quotation for your client"
                  : "Update the quotation details"}
              </p>
            </div>
          </div>

          {/* Client and Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Client *</FormLabel>
              <div className="flex gap-2">
                <Combobox
                  options={clientsOptions}
                  value={form.watch("clientId")}
                  onChange={(value) => form.setValue("clientId", value)}
                  isLoading={isLoadingClients}
                  placeholder="Select a client"
                />
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={isLoadingClients}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">
                        Add
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] md:min-w-[800px] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                      <DialogDescription>
                        Create a new client profile. This client will be
                        immediately available for selection.
                      </DialogDescription>
                    </DialogHeader>
                    <ClientForm
                      type="create"
                      onCancel={() => setIsAddDialogOpen(false)}
                      onSubmitSuccess={() => {
                        setIsAddDialogOpen(false);
                        fetchClients();
                        toast.success("Client added successfully");
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage>
                {form.formState.errors.clientId?.message}
              </FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Quotation Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Website Development Services"
                  value={form.watch("title")}
                  onChange={(e) => form.setValue("title", e.target.value)}
                />
              </FormControl>
              <FormMessage>{form.formState.errors.title?.message}</FormMessage>
            </FormItem>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormItem className="flex flex-col">
              <FormLabel>Issue Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !form.watch("issueDate") && "text-muted-foreground"
                      )}
                    >
                      {form.watch("issueDate") ? (
                        format(new Date(form.watch("issueDate")), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.watch("issueDate")
                        ? new Date(form.watch("issueDate"))
                        : undefined
                    }
                    onSelect={(date) => handleDateSelect("issueDate", date)}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage>
                {form.formState.errors.issueDate?.message}
              </FormMessage>
            </FormItem>

            <FormItem className="flex flex-col">
              <FormLabel>Valid Until *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !form.watch("validUntil") && "text-muted-foreground"
                      )}
                    >
                      {form.watch("validUntil") ? (
                        format(new Date(form.watch("validUntil")), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.watch("validUntil")
                        ? new Date(form.watch("validUntil"))
                        : undefined
                    }
                    onSelect={(date) => handleDateSelect("validUntil", date)}
                    disabled={(date) => {
                      const issueDate = form.getValues("issueDate");
                      return issueDate ? date < new Date(issueDate) : false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage>
                {form.formState.errors.validUntil?.message}
              </FormMessage>
            </FormItem>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Quotation Items</h3>
              <p className="text-sm text-muted-foreground">
                Search for products or services, or type custom descriptions
              </p>
            </div>
          </div>

          {/* Items Header */}
          <div className="grid grid-cols-12 gap-3 mb-3 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium">
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-1 text-center">Discount</div>
            <div className="col-span-1 text-center">Tax %</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {form.watch("items").map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-center p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                {/* Searchable Item Input */}
                <div className="col-span-4">
                  <SearchableItemInput
                    index={index}
                    searchTerm={searchInputs[index] || ""}
                    searchableItems={searchableItems}
                    showDropdown={showDropdown}
                    onSearchChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    onSelect={handleItemSelect}
                    setShowDropdown={setShowDropdown}
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-1">
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      className="text-center"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        const finalValue = isNaN(value) ? 1 : value;
                        handleQuantityChange(index, finalValue);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Unit Price */}
                <div className="col-span-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="text-left"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const value =
                          e.target.valueAsNumber ||
                          parseFloat(e.target.value) ||
                          0;
                        handleUnitPriceChange(index, value);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Item Discount */}
                <div className="col-span-1 space-y-1">
                  <Select
                    value={item.itemDiscountType || ""}
                    onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                      handleItemDiscountChange(
                        index,
                        value,
                        item.itemDiscountAmount || 0
                      );
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AMOUNT">R</SelectItem>
                      <SelectItem value="PERCENTAGE">%</SelectItem>
                    </SelectContent>
                  </Select>

                  {item.itemDiscountType && (
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={
                          item.itemDiscountType === "PERCENTAGE"
                            ? "0.1"
                            : "0.01"
                        }
                        placeholder="0.00"
                        className="h-8 text-center text-xs"
                        value={item.itemDiscountAmount || ""}
                        onChange={(e) => {
                          const input = e.target.value;
                          if (input === "") {
                            handleItemDiscountChange(
                              index,
                              item.itemDiscountType,
                              0
                            );
                            return;
                          }
                          let value = parseFloat(input);
                          if (isNaN(value)) {
                            handleItemDiscountChange(
                              index,
                              item.itemDiscountType,
                              0
                            );
                            return;
                          }
                          if (
                            item.itemDiscountType === "PERCENTAGE" &&
                            value > 100
                          ) {
                            value = 100;
                          }
                          handleItemDiscountChange(
                            index,
                            item.itemDiscountType,
                            value
                          );
                        }}
                      />
                    </FormControl>
                  )}
                </div>

                {/* Tax Rate */}
                <div className="col-span-1">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      className="text-center"
                      value={item.taxRate || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        handleTaxRateChange(index, value);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Item Total (Display Only) */}
                <div className="col-span-2 text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(getRowNetTotal(index))}
                  </div>
                  {calculations.itemDiscounts[index] > 0 && (
                    <div className="text-xs text-red-600">
                      -{formatCurrency(calculations.itemDiscounts[index])}
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={form.watch("items").length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Global Discount Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Global Discount</h4>
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  value={form.watch("discountType") || ""}
                  onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                    handleDiscountChange(
                      value,
                      form.getValues("discountAmount") || 0
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              {form.watch("discountType") && (
                <FormItem>
                  <FormLabel>
                    Discount Amount{" "}
                    {form.watch("discountType") === "PERCENTAGE" ? "(%)" : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={
                        form.watch("discountType") === "PERCENTAGE"
                          ? "0.1"
                          : "1.00"
                      }
                      placeholder={
                        form.watch("discountType") === "PERCENTAGE"
                          ? "0.00%"
                          : "0.00"
                      }
                      value={form.watch("discountAmount") || ""}
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === "") {
                          handleDiscountChange(
                            form.getValues("discountType"),
                            0
                          );
                          return;
                        }
                        let value = parseFloat(input);
                        if (isNaN(value)) {
                          handleDiscountChange(
                            form.getValues("discountType"),
                            0
                          );
                          return;
                        }
                        if (
                          form.watch("discountType") === "PERCENTAGE" &&
                          value > 100
                        ) {
                          value = 100;
                        }
                        handleDiscountChange(
                          form.getValues("discountType"),
                          value
                        );
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Deposit</h4>
            <div className="space-y-4">
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Require Deposit</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Request a deposit payment from the client
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={form.watch("depositRequired")}
                    onCheckedChange={(checked) => {
                      handleDepositChange(
                        checked,
                        form.getValues("depositType") || "PERCENTAGE",
                        form.getValues("depositAmount") || 50
                      );
                    }}
                  />
                </FormControl>
              </FormItem>

              {form.watch("depositRequired") && (
                <>
                  <FormItem>
                    <FormLabel>Deposit Type</FormLabel>
                    <Select
                      value={form.watch("depositType") || ""}
                      onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                        handleDepositChange(
                          true,
                          value,
                          form.getValues("depositAmount") || 50
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deposit type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormItem>
                    <FormLabel>
                      Deposit Amount{" "}
                      {form.watch("depositType") === "PERCENTAGE" ? "(%)" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={
                          form.watch("depositType") === "PERCENTAGE"
                            ? "1"
                            : "0.01"
                        }
                        placeholder={
                          form.watch("depositType") === "PERCENTAGE"
                            ? "50"
                            : "0.00"
                        }
                        value={form.watch("depositAmount") || ""}
                        onChange={(e) => {
                          const input = e.target.value;
                          if (input === "") {
                            handleDepositChange(
                              true,
                              form.getValues("depositType") || "PERCENTAGE",
                              0
                            );
                            return;
                          }
                          let value = parseFloat(input);
                          if (isNaN(value)) {
                            handleDepositChange(
                              true,
                              form.getValues("depositType") || "PERCENTAGE",
                              0
                            );
                            return;
                          }
                          if (
                            form.watch("depositType") === "PERCENTAGE" &&
                            value > 100
                          ) {
                            value = 100;
                          }
                          handleDepositChange(
                            true,
                            form.getValues("depositType") || "PERCENTAGE",
                            value
                          );
                        }}
                      />
                    </FormControl>
                  </FormItem>
                </>
              )}
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal (Gross):</span>
                <span className="font-medium">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Total Discount:</span>
                  <span className="font-medium">
                    - {formatCurrency(calculations.discountAmount)}
                  </span>
                </div>
              )}

              {/* Added Taxable Amount Display */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxable Amount:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.taxableAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.totalTax)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(calculations.totalAmount)}
                </span>
              </div>

              {form.watch("depositRequired") &&
                calculations.depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 border-t pt-3">
                      <span>Deposit:</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.depositAmount)}
                        {form.watch("depositType") === "PERCENTAGE" &&
                          ` (${form.getValues("depositAmount")}%)`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-3">
                      <span>Amount Due:</span>
                      <span className="text-blue-600">
                        {formatCurrency(calculations.amountDue)}
                      </span>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* Additional Information (Using Editor) */}
        <div className="bg-card border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Additional Information</h4>
          <div className="space-y-6">
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Editor
                  placeholder="Detailed description of the quotation..."
                  value={form.watch("description") || ""}
                  onChange={(value) => form.setValue("description", value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Editor
                    placeholder="Payment terms and conditions..."
                    value={form.watch("paymentTerms") || ""}
                    onChange={(value) => form.setValue("paymentTerms", value)}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Editor
                    placeholder="Additional notes or instructions..."
                    value={form.watch("notes") || ""}
                    onChange={(value) => form.setValue("notes", value)}
                  />
                </FormControl>
              </FormItem>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {type === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              `${type === "create" ? "Create" : "Update"} Quotation`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
