"use client";

import { useMemo, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { CouponColumn } from "./columns"; // Keep type import
import { CouponForm } from "./coupon-form";
import CouponsTable from "./coupons-table";

interface CouponsClientProps {
  data: CouponColumn[];
}

export const CouponsClient: React.FC<CouponsClientProps> = ({ data }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponColumn | null>(null);

  const handleEdit = useCallback((coupon: CouponColumn) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
        await axios.delete(`/api/coupons/${id}`);
        toast.success("Coupon deleted");
        queryClient.invalidateQueries({ queryKey: ["coupons"] });
        router.refresh(); 
    } catch (error) {
        toast.error("Something went wrong");
    }
  }, [router, queryClient]);

  const handleSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      router.refresh();
  };

  const handleClose = () => {
      setDialogOpen(false);
      setEditingCoupon(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Coupons (${data.length})`}
          description="Manage coupons for your store"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      <Separator className="my-4" />
      
      <CouponsTable 
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) handleClose();
          setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px] lg:min-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
             <DialogDescription>
              {editingCoupon ? "Modify the existing coupon details." : "Add a new coupon for usage in POS."}
            </DialogDescription>
          </DialogHeader>
          <CouponForm 
            initialData={editingCoupon} 
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
