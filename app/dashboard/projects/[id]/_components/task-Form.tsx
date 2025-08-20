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
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Priority, TaskStatus } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { taskSchema, taskSchemaType } from "@/lib/formValidationSchemas";

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
};

interface TaskFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    title?: string;
    description?: string;
    projectId?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    estimatedHours?: number;
    assignees?: { id: string }[];
  };
  projectId: string;
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function TaskForm({
  type,
  data,
  projectId,
  onCancel,
  onSubmitSuccess,
}: TaskFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<taskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      projectId: projectId,
      status: data?.status || "TODO",
      priority: data?.priority || "MEDIUM",
      dueDate: data?.dueDate,
      estimatedHours: data?.estimatedHours,
      assigneeIds: data?.assignees?.map((a) => a.id) || [],
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: taskSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/tasks", values);
        toast.success("Task created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/tasks/${data.id}`, values);
        toast.success("Task updated successfully");
      }

      onSubmitSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/employees");
      setEmployees(response.data.employees || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to load employees");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const employeeOptions = employees.map((employee) => ({
    label: employee.name,
    value: employee.id,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Task Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter Description" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
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

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Priority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
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
                      disabled={(date) => date < new Date()}
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
            name="estimatedHours"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estimated Hours (Optinal)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter estimated hours"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigneeIds"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Assignees</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={employeeOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select assignees..."
                    loading={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          <Button type="submit" disabled={isSubmitting} className="min-w-24">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create Task"
            ) : (
              "Update Task"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
