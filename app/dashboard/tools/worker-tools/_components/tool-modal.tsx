"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ImageUpload } from "@/app/dashboard/shop/products/components/ImageUpload";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  quantity: z.coerce.number().min(1).default(1),
  assignedToType: z.enum(["NONE", "EMPLOYEE", "FREELANCER"]).default("NONE"),
  assignedToId: z.string().optional(),
  condition: z.enum(["GOOD", "FAIR", "POOR", "DAMAGED"]).default("GOOD"),
  images: z.array(z.string()).default([]),
});

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const ToolModal = ({ isOpen, onClose, initialData }: ToolModalProps) => {
  const [loading, setLoading] = useState(false);

  // Fetch Employees and Freelancers
  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => (await axios.get("/api/employees")).data.employees,
    enabled: isOpen,
  });

  const { data: freelancers } = useQuery({
    queryKey: ["freelancers-list"],
    queryFn: async () => (await axios.get("/api/freelancers")).data.freelancers,
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      serialNumber: "",
      purchasePrice: 0,
      quantity: 1,
      assignedToType: "NONE",
      assignedToId: "",
      condition: "GOOD",
      images: [],
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        serialNumber: initialData.serialNumber || "",
        purchasePrice: initialData.purchasePrice,
        quantity: initialData.quantity,
        assignedToType: initialData.employeeId
          ? "EMPLOYEE"
          : initialData.freelancerId
            ? "FREELANCER"
            : "NONE",
        assignedToId: initialData.employeeId || initialData.freelancerId || "",
        condition: initialData.condition,
        images: initialData.images || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        serialNumber: "",
        purchasePrice: 0,
        quantity: 1,
        assignedToType: "NONE",
        assignedToId: "",
        condition: "GOOD",
        images: [],
      });
    }
  }, [initialData, form]);

  const assignedToType = form.watch("assignedToType");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const payload: any = {
        ...values,
        employeeId:
          values.assignedToType === "EMPLOYEE" ? values.assignedToId : null,
        freelancerId:
          values.assignedToType === "FREELANCER" ? values.assignedToId : null,
      };

      if (initialData) {
        await axios.patch(`/api/worker-tools/${initialData.id}`, payload);
        toast.success("Tool updated");
      } else {
        await axios.post("/api/worker-tools", payload);
        toast.success("Tool created");
      }

      // Invalidate queries?
      // Ideally pass an onSuccess callback to refetch parent
      onClose();
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tool" : "Add Tool"}</DialogTitle>
          <DialogDescription>
            Add a new tool to the inventory and optionally assign it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      key={isOpen ? "open" : "closed"} // Force re-mount when modal opens/closes to reset state
                      onFileUpload={(file) => {
                        field.onChange([...field.value, file.url]);
                      }}
                      onFileRemove={(url) => {
                        field.onChange(
                          [...field.value].filter((current) => current !== url),
                        );
                      }}
                      existingFiles={field.value.map((url) => ({
                        url,
                        name: "Image",
                        type: "IMAGE",
                        size: 0,
                        mimeType: "image/jpeg",
                      }))}
                      allowedTypes={["IMAGE"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Drill" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="SN-123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (R)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="POOR">Poor</SelectItem>
                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="Tool description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignment fields removed to simplify tool creation */}

            <div className="flex justify-end w-full">
              <Button disabled={loading} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
