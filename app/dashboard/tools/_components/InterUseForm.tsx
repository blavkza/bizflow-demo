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

const interUseSchema = z.object({
  projectId: z.string().optional(),
  useStartDate: z.string().min(1, "Start date is required"),
  useEndDate: z.string().min(1, "End date is required"),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
  damageReported: z.boolean().default(false),
  damageDescription: z.string().optional(),
});

type InterUseFormData = z.infer<typeof interUseSchema>;

interface Project {
  id: string;
  projectNumber: string;
  title: string;
  archived?: boolean;
  status?: string;
}

interface InterUseFormProps {
  toolId: string;
  toolName: string;
  onSubmit: (data: InterUseFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function InterUseForm({
  toolId,
  toolName,
  onSubmit,
  onCancel,
  loading = false,
}: InterUseFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const form = useForm<InterUseFormData>({
    resolver: zodResolver(interUseSchema),
    defaultValues: {
      projectId: undefined,
      useStartDate: new Date().toISOString().split("T")[0],
      useEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "ACTIVE",
      notes: "",
      damageReported: false,
      damageDescription: "",
    },
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();

        // Add proper typing to the project parameter
        const activeProjects = data.filter(
          (project: Project) =>
            !project.archived &&
            project.status !== "COMPLETED" &&
            project.status !== "CANCELLED"
        );

        setProjects(activeProjects);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const { isSubmitting } = form.formState;

  const onFormSubmit = async (values: InterUseFormData) => {
    try {
      await onSubmit(values);
      toast.success("Internal use record added successfully");
    } catch (error) {
      toast.error("Failed to add internal use record");
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
            name="projectId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Project (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={projectsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-project">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.projectNumber} - {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="useStartDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useEndDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>End Date *</FormLabel>
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
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    placeholder="Purpose of use, project details, etc..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="damageReported"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Damage Reported</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="damageDescription"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Damage Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe any damage found..."
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
              "Add Internal Use"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
