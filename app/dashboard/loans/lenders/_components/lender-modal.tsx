"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Building2, Users, Mail, Phone, X, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { DocumentUpload } from "../../_components/document-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const lenderFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  interestRate: z.coerce.number().min(0).optional().nullable(),
  termMonths: z.coerce.number().int().min(1).optional().nullable(),
  supportsCompoundInterest: z.boolean().default(false),
  supportsFixedInterest: z.boolean().default(false),
  interestTiers: z
    .array(
      z.object({
        termMonths: z.coerce.number().min(1, "Term required"),
        interestRate: z.coerce.number().min(0, "Rate required"),
      }),
    )
    .optional(),
});

type LenderFormValues = z.infer<typeof lenderFormSchema>;

interface LenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lender: any) => void;
  initialData?: any;
}

export const LenderModal = (props: LenderModalProps) => {
  const { isOpen, onClose, onSuccess, initialData } = props; // Destructuring props to avoid stale closure issues if needed, or just use props directly.

  const [loading, setLoading] = useState(false);

  const form = useForm<LenderFormValues>({
    resolver: zodResolver(lenderFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      description: "",
      interestRate: 0,
      termMonths: 1, // Default to 1 month
      supportsCompoundInterest: true,
      supportsFixedInterest: true, // Enable both by default for convenience
      interestTiers: [
        { termMonths: 3, interestRate: 40 },
        { termMonths: 6, interestRate: 50 },
        { termMonths: 9, interestRate: 60 },
        { termMonths: 12, interestRate: 75 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "interestTiers",
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Map Tiered Rates
      let tiers = initialData.interestTiers || [];

      // Fallback for migration: map old columns if no tiers exist
      if (
        tiers.length === 0 &&
        initialData.loanCalculationMethod === "FIXED_INTEREST"
      ) {
        if (initialData.interestRate3Months)
          tiers.push({
            termMonths: 3,
            interestRate: initialData.interestRate3Months,
          });
        if (initialData.interestRate6Months)
          tiers.push({
            termMonths: 6,
            interestRate: initialData.interestRate6Months,
          });
        if (initialData.interestRate9Months)
          tiers.push({
            termMonths: 9,
            interestRate: initialData.interestRate9Months,
          });
        if (initialData.interestRate12Months)
          tiers.push({
            termMonths: 12,
            interestRate: initialData.interestRate12Months,
          });
      }

      form.reset({
        ...initialData,
        supportsCompoundInterest:
          initialData.loanCalculationMethods?.includes("COMPOUND_INTEREST") ||
          initialData.loanCalculationMethod === "COMPOUND_INTEREST" ||
          false,
        supportsFixedInterest:
          initialData.loanCalculationMethods?.includes("FIXED_INTEREST") ||
          initialData.loanCalculationMethod === "FIXED_INTEREST" ||
          false,
        interestTiers: tiers,
      });
    } else {
      form.reset({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        description: "",
        interestRate: 0,
        termMonths: 1, // Default to 1 month
        supportsCompoundInterest: true,
        supportsFixedInterest: true,
        interestTiers: [
          { termMonths: 3, interestRate: 40 },
          { termMonths: 6, interestRate: 50 },
          { termMonths: 9, interestRate: 60 },
          { termMonths: 12, interestRate: 75 },
        ],
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = async (data: LenderFormValues) => {
    try {
      setLoading(true);

      const methods = [];
      if (data.supportsCompoundInterest) methods.push("COMPOUND_INTEREST");
      if (data.supportsFixedInterest) methods.push("FIXED_INTEREST");

      const payload = {
        ...data,
        loanCalculationMethods: methods,
        // Ensure numbers
        interestTiers: data.interestTiers?.map((t) => ({
          termMonths: Number(t.termMonths),
          interestRate: Number(t.interestRate),
        })),
      };

      if (initialData) {
        const response = await axios.patch(
          `/api/lenders/${initialData.id}`,
          payload,
        );
        toast.success("Lender updated successfully");
        if (onSuccess) onSuccess(response.data);
      } else {
        const response = await axios.post("/api/lenders", payload);
        toast.success("Lender created successfully");
        if (onSuccess) onSuccess(response.data);
      }
      if (!initialData) form.reset(); // Only reset on create
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        initialData ? "Failed to update lender" : "Failed to create lender",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] lg:min-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lender</DialogTitle>
          <DialogDescription>
            Enter the corporate and contact details of the lender.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                Company Details
              </h4>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="e.g. Standard Bank"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Full Name"
                            {...field}
                          />
                        </div>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="+27..."
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="email@lender.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                Offering & Terms
              </h4>

              <div className="space-y-3">
                <FormLabel>Loan Calculation Methods</FormLabel>
                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="supportsCompoundInterest"
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
                            Monthly Compound Interest (Flexible)
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Standard reducing balance loans
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supportsFixedInterest"
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
                            Long-term Fixed Interest (Tiered)
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Fixed flat rate based on term length
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {form.watch("supportsCompoundInterest") && (
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                  <h5 className="font-medium text-sm">
                    Compound Interest Defaults
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 15.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="termMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Term (Months)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {form.watch("supportsFixedInterest") && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium text-sm">
                      Tiered Interest Rates
                    </h5>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ termMonths: 3, interestRate: 0 })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Tier
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                        <FormField
                          control={form.control}
                          name={`interestTiers.${index}.termMonths`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">
                                Term (Months)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`interestTiers.${index}.interestRate`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">
                                Interest Rate (%)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mb-2"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-2">
                        No tiers added. Click "Add Tier" to define rates.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>{" "}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Physical Address" {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Background info, specific terms..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {initialData && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                  Documents
                </h4>
                <DocumentUpload
                  entityId={initialData.id}
                  entityType="lender"
                  onSuccess={() => {
                    if (onSuccess) onSuccess(initialData);
                  }}
                  showList={true}
                />
              </div>
            )}
            <DialogFooter>
              <Button disabled={loading} type="submit" className="w-full">
                {loading
                  ? "Saving..."
                  : initialData
                    ? "Save Changes"
                    : "Create Lender"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
