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
import { folderSchema, foldwerSchemaType } from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface FolderFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    title?: string;
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
  projectId: string;
}

export default function FolderForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
  projectId,
}: FolderFormProps) {
  const router = useRouter();

  const form = useForm<foldwerSchemaType>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      title: data?.title || "New folder",
      projectId: projectId,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: foldwerSchemaType) => {
    try {
      if (type === "create") {
        await axios.post("/api/folders", values);
        toast.success("Folder created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/folders/${data.id}`, values);
        toast.success("Folder updated successfully");
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-4xl space-y-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Folder Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Folder Name"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : type === "create" ? (
              "Create Folder"
            ) : (
              "Update Folder"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
