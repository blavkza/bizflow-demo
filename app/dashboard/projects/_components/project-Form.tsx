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
import { projectSchema, projectSchemaType } from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Client, Priority, User } from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

interface ProjectFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    title?: string;
    description?: string;
    managerId?: string | null;
    clientId?: string | null;
    priority?: Priority;
    startDate?: Date;
    endDate?: Date;
    deadline?: Date;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
};

export default function ProjectForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: ProjectFormProps) {
  const [usersOptions, setUsersOptions] = useState<ComboboxOption[]>([]);
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const router = useRouter();

  const form = useForm<projectSchemaType>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      managerId: data?.managerId || undefined,
      clientId: data?.clientId || undefined,
      priority: data?.priority || "MEDIUM",
      startDate: data?.startDate ? new Date(data.startDate) : new Date(),
      endDate: data?.endDate ? new Date(data.endDate) : new Date(),
      deadline: data?.deadline ? new Date(data.deadline) : new Date(),
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: projectSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/projects", values);
        toast.success("Project created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/projects/${data.id}`, values);
        toast.success("Project updated successfully");
      }

      onSubmitSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get("/api/users");
      const users: User[] = response?.data || [];
      const options = users
        .filter((user) => user.id && user.name)
        .map((user) => ({
          label: user.name || "",
          value: user.id,
        }));
      setUsersOptions(options);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients
        .filter((client) => client.id && client.name)
        .map((client) => ({
          label: client.name || "",
          value: client.id,
        }));
      setClientsOptions(options);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Project Title" {...field} />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter Description"
                    {...field}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager</FormLabel>
                <FormControl>
                  <Combobox
                    options={usersOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    isLoading={isLoadingUsers}
                    placeholder="Select manager"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client (Optional)</FormLabel>
                <FormControl>
                  <Combobox
                    options={clientsOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    isLoading={isLoadingClients}
                    placeholder="Select client"
                  />
                </FormControl>
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
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.values(Priority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
                      disabled={(date) =>
                        date < new Date("1900-01-01") ||
                        (form.watch("startDate") &&
                          date < form.watch("startDate"))
                      }
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
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Deadline</FormLabel>
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
                      disabled={(date) =>
                        date < new Date("1900-01-01") ||
                        (form.watch("endDate") && date < form.watch("endDate"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
              "Create Project"
            ) : (
              "Update Project"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
