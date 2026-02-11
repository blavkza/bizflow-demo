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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TaskStatus } from "@prisma/client";

const SubtaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  status: z.nativeEnum(TaskStatus),
});

type SubtaskSchemaType = z.infer<typeof SubtaskSchema>;

interface SubtaskFormProps {
  type: "create" | "update";
  taskId: string;
  data?: {
    id?: string;
    title?: string;
    description?: string | null;
    estimatedHours?: number;
    status?: TaskStatus;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

export default function SubtaskForm({
  type,
  taskId,
  data,
  onCancel,
  onSubmitSuccess,
}: SubtaskFormProps) {
  const router = useRouter();

  const form = useForm<SubtaskSchemaType>({
    resolver: zodResolver(SubtaskSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      estimatedHours: data?.estimatedHours || undefined,
      status: data?.status || TaskStatus.TODO,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: SubtaskSchemaType) => {
    try {
      const payload = {
        ...values,
        taskId,
      };

      if (type === "create") {
        await axios.post("/api/subtasks", payload);
        toast.success("Subtask created successfully");
      } else if (type === "update" && data?.id) {
        await axios.patch(`/api/subtasks/${data.id}`, payload);
        toast.success("Subtask updated successfully");
      }

      form.reset();
      onSubmitSuccess?.();
      router.refresh();
      onCancel?.();
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const formatLabel = (str: string) => {
    return str
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Subtask Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter subtask title"
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
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter description"
                  {...field}
                  className="w-full"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.0"
                    step="0.5"
                    min="0"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
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
              "Add Subtask"
            ) : (
              "Update Subtask"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
