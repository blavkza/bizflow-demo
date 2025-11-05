"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const maintenanceSchema = z.object({
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  cost: z.coerce.number().min(0, "Cost must be positive"),
  maintenanceDate: z.string().min(1, "Maintenance date is required"),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  toolId: string;
  toolName: string;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  employeeNumber: string | null;
}

export function MaintenanceForm({
  toolId,
  toolName,
  onSubmit,
  onCancel,
  loading = false,
}: MaintenanceFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenanceType: "",
      cost: 0,
      maintenanceDate: new Date().toISOString().split("T")[0],
      notes: "",
      assignedTo: "unassigned",
    },
  });

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const { isSubmitting } = form.formState;

  const onFormSubmit = async (values: MaintenanceFormData) => {
    try {
      // Convert "unassigned" back to null/undefined for the API if needed
      const submitData = {
        ...values,
        assignedTo:
          values.assignedTo === "unassigned" ? null : values.assignedTo,
      };
      await onSubmit(submitData);
      toast.success("Maintenance record added successfully");
    } catch (error) {
      toast.error("Failed to add maintenance record");
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Tool: <span className="font-medium">{toolName}</span>
            </p>
          </div>

          <FormField
            control={form.control}
            name="maintenanceType"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Maintenance Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Regular Service">
                      Regular Service
                    </SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Calibration">Calibration</SelectItem>
                    <SelectItem value="Battery Replacement">
                      Battery Replacement
                    </SelectItem>
                    <SelectItem value="Part Replacement">
                      Part Replacement
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Cost (ZAR) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenanceDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Maintenance Date *</FormLabel>
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
            name="assignedTo"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Assigned To</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingEmployees}
                >
                  <FormControl>
                    <SelectTrigger>
                      {loadingEmployees ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading employees...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select employee" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}{" "}
                        {employee.employeeNumber &&
                          `(${employee.employeeNumber})`}
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
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about the maintenance..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-24">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add Maintenance"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
