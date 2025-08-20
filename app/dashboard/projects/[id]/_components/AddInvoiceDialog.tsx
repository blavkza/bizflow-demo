import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Project } from "../type";
import { Combobox } from "@/components/ui/combobox";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Invoice } from "@prisma/client";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  projectInvoiceSchema,
  ProjectInvoiceSchemaType,
} from "@/lib/formValidationSchemas";
import Link from "next/link";
import { log } from "console";

interface AddInvoiceDialogProps {
  project: Project;
  fetchProject: () => void;
}

type ComboboxOption = {
  label: string;
  value: string;
};

export default function AddInvoiceDialog({
  project,
  fetchProject,
}: AddInvoiceDialogProps) {
  const [invoicesOptions, setInvoicesOptions] = useState<ComboboxOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInvoices, setHasInvoices] = useState(false);

  const clientId = project?.clientId;
  const existingInvoiceIds = project?.invoices?.map((inv) => inv.id) ?? [];

  const fetchInvoices = async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      const { data } = await axios.get<Invoice[]>("/api/invoices");
      const allInvoices = data ?? [];

      const clientInvoices = allInvoices.filter(
        (invoice) =>
          invoice.clientId === clientId &&
          invoice.status !== "CANCELLED" &&
          !existingInvoiceIds.includes(invoice.id)
      );

      const options = clientInvoices.map((invoice) => ({
        label: invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 4)}`,
        value: invoice.id,
      }));

      setInvoicesOptions(options);
      setHasInvoices(options.length > 0);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && clientId) {
      fetchInvoices();
    }
  }, [isOpen, clientId]);

  const form = useForm<ProjectInvoiceSchemaType>({
    resolver: zodResolver(projectInvoiceSchema),
    defaultValues: {
      invoiceId: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ProjectInvoiceSchemaType) => {
    try {
      await axios.put("/api/projects/invoices", {
        projectId: project.id,
        invoiceId: values.invoiceId,
      });
      toast.success("Invoice added to project successfully");
      fetchProject();
      setIsOpen(false);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Add Invoice</DialogTitle>
          <DialogDescription>
            Add Invoice For Project: {project.title}
          </DialogDescription>
        </DialogHeader>

        {!project.client ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-muted-foreground text-center">
              No Client found for this Project . Edit The Project to Add Client
            </p>
          </div>
        ) : !hasInvoices && !isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-muted-foreground text-center">
              No invoices found for this client.
            </p>
            <Link href="/dashboard/invoice/new" passHref>
              <Button>Create Invoice</Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full max-w-4xl space-y-4"
            >
              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="my-2">
                      Invoices for client :{" "}
                      {project.client?.company
                        ? `${project.client.company} (${project.client.name})`
                        : project.client?.name}
                    </FormLabel>

                    <Combobox
                      options={invoicesOptions}
                      value={field.value}
                      onChange={field.onChange}
                      isLoading={isLoading}
                      placeholder="Select invoice"
                    />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="h-10 min-w-24"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 min-w-24 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Invoice"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
