import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TransactionCeo,
  TransactionStatus,
  TransactionType,
  CategoryCeo,
  PaymentMethod,
} from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import {
  TransactionCeoFormValues,
  transactionCeoSchema,
} from "@/lib/formValidationSchemas";

interface TransactionCeoFormProps {
  type: "create" | "update";
  data?: TransactionCeo;
  onCancel?: () => void;
  onOpenChange?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
  type?: string;
};

export default function TransactionCeoForm({
  type,
  data,
  onCancel,
  onOpenChange,
  onSubmitSuccess,
}: TransactionCeoFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TransactionType>(
    data?.type || TransactionType.EXPENSE
  );
  const [categoriesOptions, setCategoriesOptions] = useState<ComboboxOption[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/categoryCeo");
      const categories: CategoryCeo[] = response?.data || [];
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const form = useForm<TransactionCeoFormValues>({
    resolver: zodResolver(transactionCeoSchema),
    defaultValues: {
      amount: data?.amount ? Number(data.amount) : 0,
      type: data?.type || TransactionType.EXPENSE,
      status: data?.status || TransactionStatus.COMPLETED,
      description: data?.description || "",
      date: data?.date ? new Date(data.date) : new Date(),
      categoryCeoId: data?.categoryCeoId || "",
      method: data?.method || undefined,
      vendor: data?.vendor || "",
      reference: data?.reference || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: TransactionCeoFormValues) => {
    try {
      if (type === "create") {
        await axios.post("/api/transactionsCeo", values);
        toast.success("Transaction created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/transactionsCeo/${data.id}`, values);
        toast.success("Transaction updated successfully");
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

  const filteredCategories = categoriesOptions.filter((category) => {
    if (selectedType === TransactionType.TRANSFER) return true;
    return category.type === selectedType;
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value as TransactionType);
                    form.resetField("categoryCeoId");
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TransactionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PaymentMethod).map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0) + method.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className="h-10"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.valueAsNumber || e.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Transaction description"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryCeoId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Category</FormLabel>
                <Combobox
                  options={filteredCategories}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isLoading}
                  placeholder="Select category"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor */}
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Vendor name"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reference */}
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Reference number"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
