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
import {
  departmentSchema,
  departmentSchemaType,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";

interface DepartmentFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    description?: string;
    managerId?: string | null;
    location?: string | null;
    floor?: string | null;
    building?: string | null;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
};

export default function DepartmentForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: DepartmentFormProps) {
  const [usersOptions, setUsersOptions] = useState<ComboboxOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const router = useRouter();

  const form = useForm<departmentSchemaType>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      managerId: data?.managerId || "",
      location: data?.location || "",
      floor: data?.floor || "",
      building: data?.building || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: departmentSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/departments", values);
        toast.success("Department created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/departments/${data.id}`, values);
        toast.success("Department updated successfully");
      }

      onSubmitSuccess?.();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  useEffect(() => {
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

    fetchUsers();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            type === "update" && "md:grid-cols-2"
          )}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Department Name" {...field} />
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
                  <Input placeholder="Enter Description" {...field} />
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
                    value={field.value}
                    onChange={field.onChange}
                    isLoading={isLoadingUsers}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "update" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Floor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="building"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Building" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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
              "Create Department"
            ) : (
              "Update Department"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
