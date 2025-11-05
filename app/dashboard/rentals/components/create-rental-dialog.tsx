"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ClientForm from "../../human-resources/clients/_components/client-Form";
import { ComboboxOption, Tool } from "../types";

const rentalFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  toolIds: z.array(z.string()).min(1, "At least one tool is required"),
  businessName: z.string().min(1, "Business name is required"),
  renterContact: z.string().optional(),
  renterEmail: z.string().email().optional().or(z.literal("")),
  renterPhone: z.string().optional(),
  rentalStartDate: z.string().min(1, "Start date is required"),
  rentalEndDate: z.string().min(1, "End date is required"),
  notes: z.string().optional(),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

interface CreateRentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientsOptions: ComboboxOption[];
  isLoadingClients: boolean;
  availableTools: Tool[];
  onClientAdded: () => void;
  onRentalCreated: () => void;
}

export default function CreateRentalDialog({
  open,
  onOpenChange,
  clientsOptions,
  isLoadingClients,
  availableTools,
  onClientAdded,
  onRentalCreated,
}: CreateRentalDialogProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      clientId: "",
      toolIds: [],
      businessName: "",
      renterContact: "",
      renterEmail: "",
      renterPhone: "",
      rentalStartDate: "",
      rentalEndDate: "",
      notes: "",
    },
  });

  const createRental = async (data: RentalFormValues) => {
    try {
      setCreating(true);
      const response = await fetch("/api/tool-rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onOpenChange(false);
        form.reset();
        onRentalCreated();
        toast.success(
          "Rental created successfully! A quotation has been generated."
        );
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating rental:", error);
      toast.error("Error creating rental");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Rental
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] lg:min-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Rental Agreement</DialogTitle>
          <DialogDescription>
            Set up a new tool rental with customer details and rental period. A
            quotation will be automatically created.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(createRental)}
            className="space-y-4"
          >
            {/* Form fields remain the same as in your original code */}
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Client</FormLabel>
                  <div className="flex w-full gap-2">
                    <FormControl className="w-full">
                      <Combobox
                        options={clientsOptions}
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isLoadingClients}
                        placeholder="Select a client"
                      />
                    </FormControl>
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
                      <DialogContent className="sm:max-w-[600px]">
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
                            onClientAdded();
                            toast.success("Client added successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tool Selection */}
            <FormField
              control={form.control}
              name="toolIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Tools to Rent</FormLabel>
                  <FormControl>
                    <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {availableTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`tool-${tool.id}`}
                            checked={field.value.includes(tool.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, tool.id]);
                              } else {
                                field.onChange(
                                  field.value.filter((id) => id !== tool.id)
                                );
                              }
                            }}
                            className="rounded"
                          />
                          <Label
                            htmlFor={`tool-${tool.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            {tool.name} - R
                            {parseFloat(
                              tool.rentalRateDaily?.toString() || "0"
                            ).toFixed(2)}
                            /day
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other form fields... */}
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name for Rental</FormLabel>
                  <FormControl>
                    <Input placeholder="Renter's business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="renterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renterPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="0821234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rentalStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rental Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rentalEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rental End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional rental notes or requirements"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Rental & Quotation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
