"use client";

import { Plus, ListTodo, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  toolName: z.string().min(2, { message: "Tool name is required." }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }),
  type: z.string().min(1, { message: "Request type is required." }),
  priority: z.string().min(1, { message: "Priority is required." }),
  description: z.string().optional(),
  workerId: z
    .string()
    .min(1, { message: "Worker (Employee/Freelancer) is required" }),
  workerType: z.enum(["EMPLOYEE", "FREELANCER"]),
});

interface ToolRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  freelancers: any[];
  tools: any[];
}

export function ToolRequestDialog({
  isOpen,
  onClose,
  employees,
  freelancers,
  tools,
}: ToolRequestDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toolName: "",
      quantity: 1,
      type: "NEW_ITEM",
      priority: "MEDIUM",
      description: "",
      workerType: "EMPLOYEE",
    },
  });

  // State for worker number input
  const [workerNumberInput, setWorkerNumberInput] = useState("");

  const workerType = form.watch("workerType");
  const workerId = form.watch("workerId");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        employeeId:
          values.workerType === "EMPLOYEE" ? values.workerId : undefined,
        freelancerId:
          values.workerType === "FREELANCER" ? values.workerId : undefined,
      };

      await axios.post("/api/tool-requests", payload);

      toast({
        title: "Success",
        description: "Tool request created successfully",
      });
      router.refresh();
      onClose();
      form.reset();
      setWorkerNumberInput(""); // Reset input
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Tool Request</DialogTitle>
          <DialogDescription>
            Submit a new request for a tool.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tool Selection Logic */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="toolName"
                  render={({ field }) => {
                    const toolOptions = useMemo(() => {
                      const params = tools.map((t) => ({
                        label: `${t.name} (${t.serialNumber})`,
                        value: t.name,
                      }));
                      return [
                        {
                          label: "-- Enter Manually --",
                          value: "MANUAL_ENTRY",
                        },
                        ...params,
                      ];
                    }, [tools]);

                    const isManualEntryMode =
                      !field.value ||
                      !tools.find((t) => t.name === field.value);

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tool</FormLabel>
                        <Combobox
                          options={toolOptions}
                          value={
                            isManualEntryMode ? "MANUAL_ENTRY" : field.value
                          }
                          onChange={(val) => {
                            if (val === "MANUAL_ENTRY") {
                              field.onChange(""); // Ready for typing
                            } else {
                              field.onChange(val);
                            }
                          }}
                          placeholder="Select a tool..."
                        />

                        {isManualEntryMode && (
                          <div className="pt-2">
                            <Input
                              placeholder="Enter custom tool name..."
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value}
                            />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="md:col-span-1">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                        <SelectItem value="NEW_ITEM">New Item</SelectItem>
                        <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                        <SelectItem value="REPAIR">Repair</SelectItem>
                        <SelectItem value="RETURN">Return</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="workerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker Type</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("workerId", ""); // Reset ID when type changes
                      setWorkerNumberInput(""); // Reset input text
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="FREELANCER">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workerId"
              render={({ field }) => {
                // Logic to handle input change and verify worker
                const currentType = workerType;
                const list =
                  currentType === "EMPLOYEE" ? employees : freelancers;
                const selectedWorker = list.find((w) => w.id === workerId);

                return (
                  <FormItem>
                    <FormLabel>
                      {currentType === "EMPLOYEE" ? "Employee" : "Freelancer"}{" "}
                      Number
                    </FormLabel>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder={`Enter ${currentType === "EMPLOYEE" ? "Employee" : "Freelancer"} Number`}
                            value={workerNumberInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkerNumberInput(val);
                              const match = list.find(
                                (w) => w.workerNumber === val,
                              );
                              if (match) {
                                field.onChange(match.id);
                              } else {
                                if (field.value) field.onChange(""); // Clear ID if match lost
                              }
                            }}
                          />
                        </FormControl>
                        {selectedWorker && (
                          <CheckCircle2 className="text-green-500 h-5 w-5" />
                        )}
                        {!selectedWorker && workerNumberInput && (
                          <AlertCircle className="text-red-500 h-5 w-5" />
                        )}
                      </div>

                      {selectedWorker ? (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                          Verified:{" "}
                          <span className="font-medium text-foreground">
                            {selectedWorker.name ||
                              selectedWorker.firstName +
                                " " +
                                selectedWorker.lastName}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Enter the exact number to verify worker.
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
