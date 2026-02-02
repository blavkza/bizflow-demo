"use client";

import { useState } from "react";
import axios from "axios";
import { Plus, Building2, Users, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
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
});

type LenderFormValues = z.infer<typeof lenderFormSchema>;

interface LenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lender: any) => void;
  initialData?: any;
}

export const LenderModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: LenderModalProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<LenderFormValues>({
    resolver: zodResolver(lenderFormSchema),
    defaultValues: initialData || {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      description: "",
      interestRate: 0,
      termMonths: 12,
    },
  });

  const onSubmit = async (data: LenderFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        const response = await axios.patch(
          `/api/lenders/${initialData.id}`,
          data,
        );
        toast.success("Lender updated successfully");
        if (onSuccess) onSuccess(response.data);
      } else {
        const response = await axios.post("/api/lenders", data);
        toast.success("Lender created successfully");
        if (onSuccess) onSuccess(response.data);
      }
      form.reset();
      onClose();
    } catch (error) {
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
                Default Offering (Terms & Rates)
              </h4>
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
                        <Input type="number" placeholder="e.g. 12" {...field} />
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
            </div>

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
