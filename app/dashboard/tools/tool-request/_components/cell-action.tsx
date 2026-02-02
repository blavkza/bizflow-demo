"use client";

import { useState } from "react";
import axios from "axios";
import {
  Check,
  X,
  MoreHorizontal,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ToolRequest } from "./columns";

interface CellActionProps {
  data: ToolRequest;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<string>("");
  const [reason, setReason] = useState("");

  const onUpdateStatus = async (status: string, currentReason: string = "") => {
    try {
      setLoading(true);
      await axios.patch(`/api/tool-requests/${data.id}`, {
        status,
        reason: currentReason,
      });
      toast({
        title: "Success",
        description: `Request ${status.toLowerCase()} successfully.`,
      });
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data || "Something went wrong.";
      toast({
        variant: "destructive",
        title: "Error",
        description:
          typeof errorMessage === "string"
            ? errorMessage
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
      setOpen(false);
      setReason("");
    }
  };

  const onConfirm = () => {
    onUpdateStatus(statusToUpdate, reason);
  };

  const openActionDialog = (status: string) => {
    if (status === "APPROVED") {
      onUpdateStatus("APPROVED");
    } else {
      setStatusToUpdate(status);
      setOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              Please provide a reason for setting this request to{" "}
              {statusToUpdate.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason here..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={
                statusToUpdate === "REJECTED" ? "destructive" : "default"
              }
              onClick={onConfirm}
              disabled={loading || !reason.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/tools/tool-request/${data.id}`)
            }
          >
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          {data.status === "PENDING" && (
            <>
              <DropdownMenuItem onClick={() => openActionDialog("APPROVED")}>
                <Check className="mr-2 h-4 w-4 text-green-600" /> Accept
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionDialog("REJECTED")}>
                <X className="mr-2 h-4 w-4 text-red-600" /> Reject
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionDialog("WAITLIST")}>
                <Clock className="mr-2 h-4 w-4 text-orange-600" /> Waitlist
              </DropdownMenuItem>
            </>
          )}
          {data.status === "WAITLIST" && (
            <>
              <DropdownMenuItem onClick={() => openActionDialog("APPROVED")}>
                <Check className="mr-2 h-4 w-4 text-green-600" /> Accept
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openActionDialog("REJECTED")}>
                <X className="mr-2 h-4 w-4 text-red-600" /> Reject
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
