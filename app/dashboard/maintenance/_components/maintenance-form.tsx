"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import {
  MaintenanceType,
  ServiceMaintenanceStatus,
  MaintenanceFrequency,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { createMaintenance } from "../actions";
import InvoiceForm from "../../invoices/new/_components/Invoice-Form";
import { Editor } from "@/components/ui/editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z
  .object({
    type: z.nativeEnum(MaintenanceType),
    clientId: z.string().min(1, "Client is required"),
    task: z.string().min(1, "Task description is required"),
    invoiceId: z.string().optional().nullable(),
    recurringInvoiceId: z.string().optional().nullable(),
    status: z
      .nativeEnum(ServiceMaintenanceStatus)
      .default(ServiceMaintenanceStatus.PENDING),

    // Routine specific
    frequency: z.nativeEnum(MaintenanceFrequency).optional().nullable(),
    customFrequencyMonths: z.coerce.number().optional().nullable(),
    scheduleStart: z.date().optional().nullable(),
    routineLocation: z.string().optional(),

    // One-Off Visits
    visits: z
      .array(
        z.object({
          location: z.string(),
          date: z.date(),
          task: z.string().optional(),
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === MaintenanceType.ROUTINE) {
      if (!data.routineLocation || data.routineLocation.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Location is required for routine maintenance",
          path: ["routineLocation"],
        });
      }
      if (!data.scheduleStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required for routine maintenance",
          path: ["scheduleStart"],
        });
      }
    } else if (data.type === MaintenanceType.ONE_OFF) {
      if (!data.visits || data.visits.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one location is required",
          path: ["visits"],
        });
      } else {
        data.visits.forEach((visit, index) => {
          if (!visit.location || visit.location.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Location is required",
              path: ["visits", index, "location"],
            });
          }
        });
      }
    }
  });

interface MaintenanceFormProps {
  clients: { id: string; name: string | null; company: string | null }[];
  invoices?: {
    id: string;
    invoiceNumber: string;
    clientId: string;
    client: { id: string; name: string | null };
  }[];
  recurringInvoices?: {
    id: string;
    description: string | null;
    clientId: string;
    client: { id: string; name: string | null };
  }[];
  onSuccess: () => void;
}

export function MaintenanceForm({
  clients,
  invoices = [],
  recurringInvoices = [],
  onSuccess,
}: MaintenanceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [useRecurring, setUseRecurring] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: MaintenanceType.ONE_OFF,
      status: ServiceMaintenanceStatus.PENDING,
      task: "",
      visits: [{ location: "", date: new Date() }], // Start with one visit for one-off
      frequency: MaintenanceFrequency.MONTHLY,
      routineLocation: "",
      invoiceId: null,
      recurringInvoiceId: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "visits",
  });

  const type = form.watch("type");
  const frequency = form.watch("frequency");
  const customFrequencyMonths = form.watch("customFrequencyMonths");
  const scheduleStart = form.watch("scheduleStart");
  const selectedClientId = form.watch("clientId");

  // Filter invoices based on selected client using useMemo
  const displayInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    if (!invoices || invoices.length === 0) return [];

    const selectedIdStr = String(selectedClientId).trim().toLowerCase();

    return invoices.filter((invoice) => {
      const invClientId = String(invoice.clientId || "")
        .trim()
        .toLowerCase();
      const invClientRelId = String(invoice.client?.id || "")
        .trim()
        .toLowerCase();

      return invClientId === selectedIdStr || invClientRelId === selectedIdStr;
    });
  }, [selectedClientId, invoices]);

  // Filter recurring invoices based on selected client using useMemo
  const displayRecurringInvoices = useMemo(() => {
    if (
      !selectedClientId ||
      !recurringInvoices ||
      recurringInvoices.length === 0
    ) {
      return [];
    }

    const targetId = String(selectedClientId).toLowerCase();

    return recurringInvoices.filter((invoice) => {
      const cId = String(invoice.clientId || "").toLowerCase();
      const relId = String(invoice.client?.id || "").toLowerCase();
      return cId === targetId || relId === targetId;
    });
  }, [selectedClientId, recurringInvoices]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && selectedClientId) {
      console.log("MaintenanceForm - Client Selection Changed:", {
        selectedClientId,
        availableRecurring: recurringInvoices?.length,
        matches: displayRecurringInvoices.length,
        recurringData: recurringInvoices?.map((r) => ({
          id: r.id,
          cId: r.clientId,
        })),
      });
    }
  }, [selectedClientId, recurringInvoices, displayRecurringInvoices]);

  const handleInvoiceSuccess = () => {
    setShowInvoiceDialog(false);
    router.refresh();
    toast.success("Invoice created successfully");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const serverData = {
        ...values,
        visits: values.type === MaintenanceType.ONE_OFF ? values.visits : [],
      };

      if (values.type === MaintenanceType.ROUTINE) {
        if (values.scheduleStart && values.routineLocation) {
          serverData.visits = [
            {
              location: values.routineLocation,
              date: values.scheduleStart,
              task: values.task,
            },
          ];
        }
      }

      const result = await createMaintenance(serverData);

      if (result.success) {
        toast.success("Maintenance record created");
        form.reset();
        onSuccess();
      } else {
        toast.error("Failed to create maintenance");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("MaintenanceForm - Validation Errors:", errors);
          toast.error("Please check the form for errors");
        })}
        className="space-y-4 py-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={MaintenanceType.ONE_OFF}>
                      One-off
                    </SelectItem>
                    <SelectItem value={MaintenanceType.ROUTINE}>
                      Routine
                    </SelectItem>
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
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ServiceMaintenanceStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <Combobox
                    options={clients.map((client) => ({
                      label: client.company || client.name || "Unknown Client",
                      value: client.id,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search client..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border rounded-md p-4 bg-muted/10">
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <div className="flex items-center space-x-3">
              <Label
                className={cn(
                  "text-xs font-semibold",
                  !useRecurring ? "text-primary" : "text-muted-foreground",
                )}
              >
                REGULAR
              </Label>
              <Switch
                id="invoice-type-toggle"
                checked={useRecurring}
                onCheckedChange={(checked) => {
                  setUseRecurring(checked);
                  if (checked) {
                    form.setValue("invoiceId", null);
                  } else {
                    form.setValue("recurringInvoiceId", null);
                  }
                }}
              />
              <Label
                className={cn(
                  "text-xs font-semibold",
                  useRecurring ? "text-primary" : "text-muted-foreground",
                )}
              >
                RECURRING
              </Label>
            </div>
          </div>

          {!useRecurring ? (
            <div className="flex gap-2 items-end">
              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Regular Invoice (Optional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={displayInvoices.map((invoice) => ({
                          label: `${invoice.invoiceNumber} - ${invoice.client.name}`,
                          value: invoice.id,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          selectedClientId
                            ? displayInvoices.length > 0
                              ? "Search regular invoice..."
                              : "No regular invoices for this client"
                            : "Select a client first"
                        }
                        disabled={
                          !selectedClientId || displayInvoices.length === 0
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                className=""
                onClick={() => setShowInvoiceDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <FormField
                control={form.control}
                name="recurringInvoiceId"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormLabel>Recurring Invoice (Optional)</FormLabel>
                    <FormControl>
                      <Combobox
                        options={displayRecurringInvoices.map((invoice) => ({
                          label: `${invoice.description || "Recurring Invoice"} (${invoice.client?.name || "No Client"})`,
                          value: invoice.id,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          selectedClientId
                            ? displayRecurringInvoices.length > 0
                              ? "Search recurring invoice..."
                              : "No recurring invoices for this client"
                            : "Select a client first"
                        }
                        disabled={
                          !selectedClientId ||
                          displayRecurringInvoices.length === 0
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                className=""
                onClick={() => setShowInvoiceDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-4xl lg:min-w-[90vw] max-h-[95vh] overflow-y-auto w-full">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm
              type="create"
              data={{} as any}
              onCancel={() => setShowInvoiceDialog(false)}
              onSubmitSuccess={handleInvoiceSuccess}
            />
          </DialogContent>
        </Dialog>

        <FormField
          control={form.control}
          name="task"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Editor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter detailed task description..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ONE-OFF SPECIFIC UI */}
        {type === MaintenanceType.ONE_OFF && (
          <div className="space-y-4 border rounded-md p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <FormLabel>Visits / Locations</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ location: "", date: new Date() })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`visits.${index}.location`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-5">
                  <FormField
                    control={form.control}
                    name={`visits.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>
                          Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROUTINE SPECIFIC UI */}
        {type === MaintenanceType.ROUTINE && (
          <div className="space-y-4 border rounded-md p-4 bg-muted/20">
            <FormLabel className="text-base font-semibold">
              Routine Schedule
            </FormLabel>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (val === "MONTHLY") {
                          field.onChange(MaintenanceFrequency.MONTHLY);
                          form.setValue("customFrequencyMonths", null);
                        } else if (val.startsWith("CUSTOM_")) {
                          field.onChange(MaintenanceFrequency.CUSTOM);
                          const months = parseInt(val.replace("CUSTOM_", ""));
                          form.setValue("customFrequencyMonths", months);
                        }
                      }}
                      defaultValue={
                        frequency === MaintenanceFrequency.MONTHLY
                          ? "MONTHLY"
                          : frequency === MaintenanceFrequency.CUSTOM &&
                              customFrequencyMonths
                            ? `CUSTOM_${customFrequencyMonths}`
                            : undefined
                      }
                      value={
                        frequency === MaintenanceFrequency.MONTHLY
                          ? "MONTHLY"
                          : frequency === MaintenanceFrequency.CUSTOM &&
                              customFrequencyMonths
                            ? `CUSTOM_${customFrequencyMonths}`
                            : undefined
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="CUSTOM_2">Every 2 Months</SelectItem>
                        <SelectItem value="CUSTOM_3">Every 3 Months</SelectItem>
                        <SelectItem value="CUSTOM_4">Every 4 Months</SelectItem>
                        <SelectItem value="CUSTOM_5">Every 5 Months</SelectItem>
                        <SelectItem value="CUSTOM_6">Every 6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduleStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-3">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="routineLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {frequency && scheduleStart && (
              <div className="rounded-md bg-muted p-4 text-sm">
                <h4 className="font-semibold mb-2">Upcoming Schedule</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {(() => {
                    const dates = [];
                    let currentDate = new Date(scheduleStart);
                    let monthsToAdd = 1;

                    if (
                      frequency === MaintenanceFrequency.CUSTOM &&
                      customFrequencyMonths
                    ) {
                      monthsToAdd = customFrequencyMonths;
                    }

                    for (let i = 0; i < 3; i++) {
                      dates.push(new Date(currentDate));
                      currentDate.setMonth(
                        currentDate.getMonth() + monthsToAdd,
                      );
                    }

                    return dates.map((date, i) => (
                      <li key={i}>{format(date, "PPP")}</li>
                    ));
                  })()}
                </ul>
              </div>
            )}
            <FormDescription>
              The system will automatically generate maintenance tasks based on
              this schedule.
            </FormDescription>
          </div>
        )}

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Maintenance
        </Button>
      </form>
    </Form>
  );
}
