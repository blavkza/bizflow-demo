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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { GeneralSetting } from "@prisma/client";
import { GeneralSettingsFormLoading } from "./GeneralSettingsFormLoading";
import {
  GeneralSettingsSchema,
  GeneralSettingsSchemaType,
} from "@/lib/formValidationSchemas";

export default function GeneralSettingsForm() {
  const router = useRouter();
  const [generalSettings, setGeneralSettings] = useState<GeneralSetting | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const form = useForm<GeneralSettingsSchemaType>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: {
      companyName: "",
      taxId: "",
      phone: "",
      email: "",
      bankAccount: "",
      website: "",
      paymentTerms: "",
      note: "",
      address: "",
      city: "",
      province: "",
      postCode: "",
    },
  });

  const { isSubmitting } = form.formState;

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/general");
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch settings", error);
      return null;
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await fetchSettings();
        setGeneralSettings(settings);

        if (settings) {
          form.reset({
            companyName: settings.companyName,
            taxId: settings.taxId || "",
            phone: settings.phone || "",
            email: settings.email || "",
            address: settings.address,
            city: settings.city,
            website: settings.website,
            paymentTerms: settings.paymentTerms,
            note: settings.wenotebsite,
            bankAccount: settings.bankAccount,
            province: settings.province,
            postCode: settings.postCode,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form]);

  const onSubmit = async (values: GeneralSettingsSchemaType) => {
    try {
      await axios.post("/api/settings/general", values);
      toast.success(
        generalSettings
          ? "Settings updated successfully"
          : "Initial settings saved successfully"
      );
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    } finally {
    }
  };

  if (loading) {
    return <GeneralSettingsFormLoading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {generalSettings
            ? "Company Information"
            : "Setup Company Information"}
        </CardTitle>
        <CardDescription>
          {generalSettings
            ? "Update your company details and business information."
            : "Please provide your company details to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 p-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Company / Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company name"
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
                name="taxId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Tax Id (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Tax Id"
                        {...field}
                        className="w-full"
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
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company phone"
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
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company email"
                        {...field}
                        className="w-full"
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
                name="website"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Company / Business Website (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company Website"
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
                name="bankAccount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Back Account (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Bank Account"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/*INVOICE*/}
            <p>INVOICE / Quotation SETTINGS</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Payment Terms (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company Website"
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
                name="note"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Invoice / Quotation Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Bank Account"
                        {...field}
                        className="w-full"
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
                <FormItem className="space-y-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter address"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter province"
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
                name="city"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter city"
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
                name="postCode"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Post Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter post code"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="min-w-24"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : generalSettings ? (
                  "Update Settings"
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
