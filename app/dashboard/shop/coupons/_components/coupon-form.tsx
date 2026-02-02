"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CouponColumn } from "./columns";
import { MultiSelect, Option } from "@/components/ui/multi-select";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  minOrderAmount: z.coerce.number().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  usageLimit: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).optional(),
});

interface CouponFormProps {
  initialData: CouponColumn | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const CouponForm: React.FC<CouponFormProps> = ({
  initialData,
  onSuccess,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  // Fetch products for selection
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await axios.get('/api/shop/products?limit=1000'); // Fetch enough products
      return res.data.products.map((p: any) => ({
        label: p.name,
        value: p.id
      }));
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        ...initialData,
        type: initialData.type === "AMOUNT" ? "FIXED_AMOUNT" : initialData.type as "PERCENTAGE" | "FIXED_AMOUNT",
        minOrderAmount: initialData.minOrderAmount ?? undefined,
        usageLimit: initialData.usageLimit ?? undefined,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
        endDate: initialData.endDate && initialData.endDate !== "N/A" ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
        // @ts-ignore - Assuming initialData comes with products if populated properly, but for now defaulting to empty if not present. 
        // Real implementation might need a separate fetch for details if initialData is just columns.
        productIds: (initialData as any).products?.map((p: any) => p.id) || [],
      } 
      : {
          code: "",
          type: "PERCENTAGE",
          value: 0,
          minOrderAmount: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: "",
          usageLimit: 0,
          isActive: true,
          productIds: [],
        },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
     
      const payload = {
          ...values,
          type: values.type === "FIXED_AMOUNT" ? "AMOUNT" : values.type,
      };

      if (initialData) {
        await axios.patch(`/api/coupons/${initialData.id}`, payload);
      } else {
        await axios.post(`/api/coupons`, payload);
      }
      toast.success(initialData ? "Coupon updated" : "Coupon created");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="COUPON123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Type</FormLabel>
                <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue defaultValue={field.value} placeholder="Select type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                    <Input type="number" disabled={loading} placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                    <Input type="date" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                    <Input type="date" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="minOrderAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Min Order Amount</FormLabel>
                <FormControl>
                    <Input type="number" disabled={loading} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="usageLimit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Usage Limit</FormLabel>
                <FormControl>
                    <Input type="number" disabled={loading} placeholder="Leave empty for unlimited" {...field} />
                </FormControl>
                <FormDescription>Total number of times this coupon can be used.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="productIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies to specific products (Optional)</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={productsData || []}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select products..."
                    loading={isLoadingProducts}
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to apply to all products (unless logic dictates otherwise).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Active
                </FormLabel>
                <FormDescription>
                  This coupon can be used in the shop.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
            <Button disabled={loading} variant="outline" onClick={onClose} type="button">
                Cancel
            </Button>
            <Button disabled={loading} type="submit">
                {initialData ? "Save Changes" : "Create Coupon"}
            </Button>
        </div>
      </form>
    </Form>
  );
};
