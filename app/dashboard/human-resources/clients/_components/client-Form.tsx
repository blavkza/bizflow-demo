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

interface UserFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    email?: string;
    company?: string | null;
    phone?: string | null;
    status: ClientStatus;
    type: ClientType;
    taxNumber?: string | null;
    website?: string | null;
    address?: string | null;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function ClientForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: UserFormProps) {
  const form = useForm<clientSchemaType>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: data?.name || "",
      company: data?.company || "",
      phone: data?.phone || "",
      email: data?.email || "",
      type: (data?.type as ClientType) || "",
      taxNumber: data?.taxNumber || "",
      website: data?.website || "",
      address: data?.address || "",
    },
  });

  const { isSubmitting } = form.formState;

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
        {/* Main Fields - 2 columns */}
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            type === "update" && "md:grid-cols-2"
          )}
        >
          {" "}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Full Name</FormLabel>
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
            name="company"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Company Name (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter Company Name"
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
                    placeholder="Enter email"
                    type="email"
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
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Phone</FormLabel>
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
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Type</FormLabel>
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
        </div>

        {/* Update-only Fields - 2 columns */}
        {type === "update" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tax Number (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Tax Number"
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
                  <FormLabel>Website (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Website"
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
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Address"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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
