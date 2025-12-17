"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
import { clientSchema, clientSchemaType } from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ClientStatus, ClientType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

interface UserFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    email?: string;
    company?: string | null;
    phone?: string | null;
    phone2?: string | null;
    status: ClientStatus;
    type: ClientType;
    taxNumber?: string | null;
    vatNumber?: string | null;
    website?: string | null;
    address?: string | null;
    country?: string | null;
    province?: string | null;
    town?: string | null;
    village?: string | null;
    street?: string | null;
    companyFullName?: string | null;
    tradingName?: string | null;
    registrationNumber?: string | null;
    telNo1?: string | null;
    telNo2?: string | null;
    companyCountry?: string | null;
    companyProvince?: string | null;
    companytown?: string | null;
    companyvillage?: string | null;
    companystreet?: string | null;
    companyaddress?: string | null;
    additionalInfo?: string | null;
    creditLimit?: string | null;
    paymentTerms?: number | null;
    currency?: string;
    assignedTo?: string | null;
    source?: string | null;
    notes?: string | null;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

// Helper function to convert null/undefined to empty string
const safeString = (value: string | null | undefined): string => {
  return value || "";
};

export default function ClientForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: UserFormProps) {
  const [useSameAddress, setUseSameAddress] = useState(false);
  const router = useRouter();

  const form = useForm<clientSchemaType>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: safeString(data?.name),
      phone: safeString(data?.phone),
      phone2: safeString(data?.phone2),
      email: safeString(data?.email),
      type: data?.type || ClientType.INDIVIDUAL,
      status: data?.status || ClientStatus.ACTIVE,
      taxNumber: safeString(data?.taxNumber),
      vatNumber: safeString(data?.vatNumber),
      website: safeString(data?.website),
      address: safeString(data?.address),
      country: safeString(data?.country),
      province: safeString(data?.province),
      town: safeString(data?.town),
      village: safeString(data?.village),
      street: safeString(data?.street),
      companyFullName: safeString(data?.companyFullName),
      tradingName: safeString(data?.tradingName),
      registrationNumber: safeString(data?.registrationNumber),
      telNo1: safeString(data?.telNo1),
      telNo2: safeString(data?.telNo2),
      companyCountry: safeString(data?.companyCountry),
      companyProvince: safeString(data?.companyProvince),
      companytown: safeString(data?.companytown),
      companyvillage: safeString(data?.companyvillage),
      companystreet: safeString(data?.companystreet),
      companyaddress: safeString(data?.companyaddress),
      additionalInfo: safeString(data?.additionalInfo),
      creditLimit: safeString(data?.creditLimit),
      paymentTerms: data?.paymentTerms || undefined,
      currency: data?.currency || "ZAR",
      assignedTo: safeString(data?.assignedTo),
      source: safeString(data?.source),
      notes: safeString(data?.notes),
    },
  });

  const { isSubmitting } = form.formState;
  const clientType = form.watch("type");

  // Watch personal address fields and copy to company address when useSameAddress is true
  useEffect(() => {
    if (useSameAddress) {
      const personalAddress = {
        country: form.getValues("country"),
        province: form.getValues("province"),
        town: form.getValues("town"),
        village: form.getValues("village"),
        street: form.getValues("street"),
        address: form.getValues("address"),
      };

      form.setValue("companyCountry", personalAddress.country);
      form.setValue("companyProvince", personalAddress.province);
      form.setValue("companytown", personalAddress.town);
      form.setValue("companyvillage", personalAddress.village);
      form.setValue("companystreet", personalAddress.street);
      form.setValue("companyaddress", personalAddress.address);
    }
  }, [useSameAddress, form]);

  const onSubmit = async (values: clientSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/clients", values);
        toast.success("Client created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/clients/${data.id}`, values);
        toast.success("Client updated successfully");
      }

      form.reset();
      onSubmitSuccess?.();
      onCancel?.();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-6"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email (optional)"
                      type="email"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="w-full"
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
                <FormItem className="space-y-2">
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Phone"
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
              name="phone2"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Phone 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter secondary phone"
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
                  <FormLabel>Type *</FormLabel>
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
                      {Object.values(ClientType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                <FormItem className="space-y-2">
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ClientStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Personal Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Personal Address Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full address"
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
              name="country"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Country"
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
              name="province"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Province</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Province"
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
              name="town"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Town</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Town"
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
              name="village"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Village</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Village"
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
              name="street"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Street"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Company Information - Only show when type is COMPANY */}
        {clientType !== ClientType.INDIVIDUAL && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company Information</h3>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyFullName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Company Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company full legal name"
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
                name="tradingName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Trading Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter trading name"
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
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter registration number"
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
                name="vatNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>VAT Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter VAT number"
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
                name="taxNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Tax Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tax number"
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
                name="website"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter website"
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
                name="telNo1"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Telephone 1</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter primary telephone"
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
                name="telNo2"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Telephone 2</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter secondary telephone"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Company Address */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useSameAddress"
                  checked={useSameAddress}
                  onCheckedChange={(checked) =>
                    setUseSameAddress(checked as boolean)
                  }
                />
                <label
                  htmlFor="useSameAddress"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use same address as personal address
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyaddress"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Full Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company full address"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyCountry"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company country"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyProvince"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Province</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company province"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companytown"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Town</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company town"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyvillage"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Village</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company village"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companystreet"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Company Street</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company street"
                          {...field}
                          className="w-full"
                          disabled={useSameAddress}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional company information"
                      {...field}
                      className="w-full min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Financial Information */}
        {/* <div className="space-y-4">
          <h3 className="text-lg font-semibold">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Credit Limit"
                      type="number"
                      step="0.01"
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
              name="paymentTerms"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Payment Terms (Days)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Payment Terms in Days"
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ZAR">
                        ZAR - South African Rand
                      </SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div> */}

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Assigned To</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Assigned Person"
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
              name="source"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Source"
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
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes"
                    {...field}
                    className="w-full min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
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
              "Create Client"
            ) : (
              "Update Client"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
