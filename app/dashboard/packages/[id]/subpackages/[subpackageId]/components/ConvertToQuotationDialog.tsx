"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Loader2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import ClientForm from "@/app/dashboard/human-resources/clients/_components/client-Form";
import axios from "axios";

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface ConvertToQuotationDialogProps {
  subpackageId: string;
  subpackageName: string;
  packageId: string;
}

export function ConvertToQuotationDialog({
  subpackageId,
  subpackageName,
  packageId,
}: ConvertToQuotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientsOptions, setClientsOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients
        .filter((client) => client.id && client.name)
        .map((client) => ({
          label: client.company
            ? `${client.name} (${client.company})`
            : client.name,
          value: client.id,
        }));
      setClientsOptions(options);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setIsLoadingClients(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setClientId(""); // Reset selection when dialog closes
    }
  };

  const handleConvert = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConverting(true);

      const response = await axios.post(
        `/api/subpackages/${subpackageId}/convert`,
        { clientId }
      );

      const data = response.data;

      toast({
        title: "Success",
        description: "Subpackage converted to quotation successfully",
      });

      setOpen(false);
      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error converting to quotation:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to convert to quotation";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleClientAdded = () => {
    setIsAddDialogOpen(false);
    fetchClients();
    toast({
      title: "Success",
      description: "Client added successfully",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Convert to Quotation
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] md:min-w-[600px]">
          <DialogHeader>
            <DialogTitle>Convert to Quotation</DialogTitle>
            <DialogDescription>
              Select a client for the quotation generated from "{subpackageName}
              ".
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select Client</label>
              <div className="flex gap-2">
                <Combobox
                  options={clientsOptions}
                  value={clientId}
                  onChange={setClientId}
                  isLoading={isLoadingClients}
                  placeholder="Select a client"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setIsAddDialogOpen(true)}
                  disabled={isLoadingClients}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only md:ml-2">Add</span>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Quotation Details</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • All products and services from the subpackage will be
                  included
                </li>
                <li>• Subpackage pricing and discounts will be applied</li>
                <li>• You can edit the quotation after creation</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={isConverting || !clientId}
            >
              {isConverting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Convert to Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:min-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client profile. This client will be immediately
              available for selection.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            type="create"
            onCancel={() => setIsAddDialogOpen(false)}
            onSubmitSuccess={handleClientAdded}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
