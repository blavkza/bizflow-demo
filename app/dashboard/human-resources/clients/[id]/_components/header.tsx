"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Edit, Mail } from "lucide-react";

import { Client, ClientStatus } from "@prisma/client";
import ClientForm from "../../_components/client-Form";
import { useRouter } from "next/navigation";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";

interface HeaderProps {
  client: Client & {
    invoices?: {
      totalAmount: Number;
      status: string;
      issueDate: Date;
      payments: {
        amount: Number;
        paidAt: Date | null;
      }[];
    }[];
  };
}

export default function Header({ client }: HeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(client.avatar);

  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "Active":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} />
            ) : (
              <AvatarFallback className="text-2xl">
                {getInitials(client.name)}
              </AvatarFallback>
            )}
          </Avatar>

          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100"
            onClick={() => setIsDialogOpen(true)}
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Change profile picture</span>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.company}</p>
          <p className="text-muted-foreground">{client.email}</p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge className={getStatusColor(client.status)}>
              {client.status}
            </Badge>
            <Badge variant="outline">{client.type}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl">Edit Client</DialogTitle>
              <DialogDescription className="text-base">
                Update client information below. All changes will be saved
                immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ClientForm
                type="update"
                data={{
                  ...client,
                  phone: client.phone ?? undefined,
                  status: client.status as ClientStatus,
                }}
                onCancel={() => setIsEditDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsEditDialogOpen(false);
                  router.refresh();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Send Invoice
        </Button>
      </div>

      <AvatarUploadDialog
        type="client"
        user={client}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAvatarUpdate={setAvatarUrl}
      />
    </div>
  );
}
