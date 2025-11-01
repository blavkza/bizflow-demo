"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings2, Loader2, Receipt, Truck, Percent } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GeneralSettingsFormLoading } from "./GeneralSettingsFormLoading";

// Validation Schema for POS Settings
const POSSettingsSchema = z.object({
  // VAT Settings
  vatEnabled: z.boolean(),
  vatRate: z.number().min(0).max(100),

  // Delivery Settings
  deliveryEnabled: z.boolean(),
  deliveryFee: z.number().min(0),
  freeDeliveryAbove: z.number().min(0),

  // Discount Settings
  discountEnabled: z.boolean(),
  maxDiscountRate: z.number().min(0).max(100),

  // Receipt Settings
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  printAutomatically: z.boolean(),
  emailReceipt: z.boolean(),
});

type POSSettingsSchemaType = z.infer<typeof POSSettingsSchema>;

interface POSSettings {
  id: string;
  vatEnabled: boolean;
  vatRate: number;
  deliveryEnabled: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number;
  discountEnabled: boolean;
  maxDiscountRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
  printAutomatically: boolean;
  emailReceipt: boolean;
}

interface POSSettingsFormProps {
  canManageSettings: boolean;
  hasFullAccess: boolean;
}

export default function POSSettingsForm({
  canManageSettings,
  hasFullAccess,
}: POSSettingsFormProps) {
  const router = useRouter();
  const [posSettings, setPosSettings] = useState<POSSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<POSSettingsSchemaType>({
    resolver: zodResolver(POSSettingsSchema),
    defaultValues: {
      vatEnabled: true,
      vatRate: 15,
      deliveryEnabled: true,
      deliveryFee: 50,
      freeDeliveryAbove: 500,
      discountEnabled: true,
      maxDiscountRate: 20,
      receiptHeader: "",
      receiptFooter: "",
      printAutomatically: false,
      emailReceipt: true,
    },
  });

  const { isSubmitting } = form.formState;

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/pos");
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch POS settings", error);
      return null;
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await fetchSettings();
        setPosSettings(settings);

        if (settings) {
          form.reset({
            vatEnabled: settings.vatEnabled,
            vatRate: settings.vatRate * 100, // Convert to percentage for display
            deliveryEnabled: settings.deliveryEnabled,
            deliveryFee: settings.deliveryFee,
            freeDeliveryAbove: settings.freeDeliveryAbove,
            discountEnabled: settings.discountEnabled,
            maxDiscountRate: settings.maxDiscountRate,
            receiptHeader: settings.receiptHeader || "",
            receiptFooter: settings.receiptFooter || "",
            printAutomatically: settings.printAutomatically,
            emailReceipt: settings.emailReceipt,
          });
        }
      } catch (error) {
        console.error("Error loading POS settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form]);

  const onSubmit = async (values: POSSettingsSchemaType) => {
    try {
      // Convert vatRate back to decimal for storage
      const submitData = {
        ...values,
        vatRate: values.vatRate / 100,
      };

      await axios.put("/api/settings/pos", submitData);
      toast.success(
        posSettings
          ? "POS settings updated successfully"
          : "POS settings saved successfully"
      );
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  if (loading) {
    return <GeneralSettingsFormLoading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {posSettings ? "POS Settings" : "Setup POS Settings"}
        </CardTitle>
        <CardDescription>
          {posSettings
            ? "Manage your Point of Sale settings including VAT, delivery, discounts, and receipts."
            : "Configure your POS settings to customize your point of sale system."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 p-6"
          >
            {/* VAT Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Percent className="h-5 w-5" />
                VAT Settings
              </h3>

              <FormField
                control={form.control}
                name="vatEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable VAT</FormLabel>
                      <FormDescription>
                        Apply VAT to all sales transactions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("vatEnabled") && (
                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>VAT Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormDescription>
                        The VAT percentage to apply to sales
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Settings
              </h3>

              <FormField
                control={form.control}
                name="deliveryEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Delivery
                      </FormLabel>
                      <FormDescription>
                        Allow delivery orders in POS
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("deliveryEnabled") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryFee"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Delivery Fee (R)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                            className="w-full"
                            disabled={!hasFullAccess && !canManageSettings}
                          />
                        </FormControl>
                        <FormDescription>
                          Standard delivery charge
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="freeDeliveryAbove"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Free Delivery Above (R)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                            className="w-full"
                            disabled={!hasFullAccess && !canManageSettings}
                          />
                        </FormControl>
                        <FormDescription>
                          Order amount for free delivery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Discount Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discount Settings
              </h3>

              <FormField
                control={form.control}
                name="discountEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Discounts
                      </FormLabel>
                      <FormDescription>
                        Allow discounts on sales
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!hasFullAccess && !canManageSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("discountEnabled") && (
                <FormField
                  control={form.control}
                  name="maxDiscountRate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Maximum Discount Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className="w-full"
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum discount percentage allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Receipt Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="printAutomatically"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Auto Print Receipt
                        </FormLabel>
                        <FormDescription>
                          Print receipt after sale
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailReceipt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Email Receipt
                        </FormLabel>
                        <FormDescription>
                          Send receipt via email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!hasFullAccess && !canManageSettings}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="receiptHeader"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Receipt Header</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter custom receipt header text..."
                        {...field}
                        className="w-full"
                        disabled={!hasFullAccess && !canManageSettings}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom text to display at the top of receipts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptFooter"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Receipt Footer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter custom receipt footer text..."
                        {...field}
                        className="w-full"
                        disabled={!hasFullAccess && !canManageSettings}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom text to display at the bottom of receipts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              {(hasFullAccess || canManageSettings) && (
                <Button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : posSettings ? (
                    "Update Settings"
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
