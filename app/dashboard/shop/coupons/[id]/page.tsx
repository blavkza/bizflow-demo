"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

import { CouponDetailSkeleton } from "./_components/coupon-detail-skeleton";
import { CouponForm } from "../_components/coupon-form";
import Header from "./_components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: coupon, isLoading } = useQuery({
    queryKey: ["coupon", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/coupons/${id}`);
      return data;
    },
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axios.delete(`/api/coupons/${id}`);
      toast.success("Coupon deleted");
      router.push("/dashboard/shop/coupons");
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["coupon", id] });
    setEditDialogOpen(false);
  };

  if (isLoading) return <CouponDetailSkeleton />;
  if (!coupon) return <div className="p-8">Coupon not found</div>;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Header 
        coupon={coupon} 
        onEdit={() => setEditDialogOpen(true)} 
        onDelete={handleDelete} 
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Code</p>
                     <p className="text-lg font-bold">{coupon.code}</p>
                 </div>
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Type</p>
                     <p className="text-lg">{coupon.type}</p>
                 </div>
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Value</p>
                     <p className="text-lg">
                        {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `R ${Number(coupon.value).toFixed(2)}`}
                     </p>
                 </div>
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Status</p>
                     <p className="text-lg">{coupon.isActive ? "Active" : "Inactive"}</p>
                 </div>
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                     <p>{format(new Date(coupon.startDate), "PPP")}</p>
                 </div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">End Date</p>
                     <p>{coupon.endDate ? format(new Date(coupon.endDate), "PPP") : "No Expiry"}</p>
                 </div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">Min Order Amount</p>
                     <p>{coupon.minOrderAmount ? `R ${Number(coupon.minOrderAmount).toFixed(2)}` : "None"}</p>
                 </div>
                 <div>
                     <p className="text-sm font-medium text-muted-foreground">Usage Limit</p>
                     <p>{coupon.usageLimit || "Unlimited"}</p>
                 </div>
             </div>
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Usage statistics for this coupon</CardDescription>
          </CardHeader>
          <CardContent>
               <div className="text-center py-8">
                   <p className="text-4xl font-bold">{coupon.usedCount}</p>
                   <p className="text-muted-foreground">Times Used</p>
               </div>
               {coupon.usageLimit && (
                   <div className="text-center">
                       <p className="text-sm text-muted-foreground">
                           {((coupon.usedCount / coupon.usageLimit) * 100).toFixed(1)}% of limit reached
                       </p>
                   </div>
               )}
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Applicable Products</CardTitle>
            <CardDescription>
                This coupon applies to {coupon.products?.length || 0} specific products. If empty, it applies to all.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {coupon.products && coupon.products.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Price</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {coupon.products.map((prod: any) => (
                              <TableRow key={prod.id}>
                                  <TableCell>{prod.sku}</TableCell>
                                  <TableCell>{prod.name}</TableCell>
                                  <TableCell>R {Number(prod.price).toFixed(2)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-8 text-muted-foreground">
                      Applies to all products
                  </div>
              )}
          </CardContent>
        </Card>

       <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
            <CardDescription>
                Recent sales where this coupon was applied.
            </CardDescription>
          </CardHeader>
          <CardContent>
              {coupon.sales && coupon.sales.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Sale Number</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Total</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {coupon.sales.map((sale: any) => (
                              <TableRow key={sale.id}>
                                  <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                                  <TableCell>{format(new Date(sale.createdAt), "PPP")}</TableCell>
                                  <TableCell>{sale.customerName || "Walk-in Customer"}</TableCell>
                                  <TableCell>R {Number(sale.total).toFixed(2)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-8 text-muted-foreground">
                      No usage history yet
                  </div>
              )}
          </CardContent>
        </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] lg:min-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
             <DialogDescription>
              Modify the existing coupon details.
            </DialogDescription>
          </DialogHeader>
          <CouponForm 
            initialData={coupon} 
            onSuccess={handleEditSuccess}
            onClose={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
