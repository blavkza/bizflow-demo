"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

// Types
import { OrderData, Employee, EmailType } from "@/types/order";

// Constants
import { UNSELECTED } from "./utils";

// Components
import OrderHeader from "./components/OrderHeader";
import OrderActions from "./components/OrderActions";
import EmailDialog from "./components/EmailDialog";
import EditOrderDialog from "./components/EditOrderDialog";
import CancelOrderDialog from "./components/CancelOrderDialog";

// Services & Generators
import { emailService } from "@/lib/order-email-service";
import { receiptGenerator } from "@/lib/receipt-generator";
import { DeliveryNoteGenerator } from "@/lib/delivery-note-generator";
import OrderInfoCards from "./components/OrderInfoCards";
import OrderItemsTable from "./components/OrderItemsTable";
import OrderSummaryCards from "./components/OrderSummaryCards";

// Hooks
import { useCompanyInfo } from "@/hooks/use-company-info";
import OrderDetailSkeleton from "./OrderDetailSkeleton";

export default function OrderDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const { companyInfo } = useCompanyInfo();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailType, setEmailType] = useState<EmailType>("receipt");
  const [customerEmail, setCustomerEmail] = useState("");

  // Form states for editing
  const [editStatus, setEditStatus] = useState(UNSELECTED);
  const [editPaymentStatus, setEditPaymentStatus] = useState(UNSELECTED);
  const [editAssignedTo, setEditAssignedTo] = useState(UNSELECTED);
  const [editCarrier, setEditCarrier] = useState(UNSELECTED);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editShippingAddress, setEditShippingAddress] = useState("");
  const [editShippingCity, setEditShippingCity] = useState("");
  const [editShippingProvince, setEditShippingProvince] = useState("");
  const [editShippingPostal, setEditShippingPostal] = useState("");
  const [editShippingCountry, setEditShippingCountry] = useState("");

  // Loading states for actions
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [isPrintingDeliveryNote, setIsPrintingDeliveryNote] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Set company info for receipt generator
  useEffect(() => {
    if (companyInfo) {
      receiptGenerator.setCompanyInfo(companyInfo);
    }
  }, [companyInfo]);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
      fetchEmployees();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shop/orders/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch order");

      const data: OrderData = await response.json();
      setOrderData(data);

      // Initialize form states
      setEditStatus(data.status || UNSELECTED);
      setEditPaymentStatus(data.paymentStatus || UNSELECTED);
      setEditAssignedTo(data.assignedTo || UNSELECTED);
      setEditCarrier(data.carrier || UNSELECTED);
      setEditDeliveryDate(
        data.deliveryDate ? data.deliveryDate.split("T")[0] : ""
      );
      setEditShippingAddress(data.shippingAddress || "");
      setEditShippingCity(data.shippingCity || "");
      setEditShippingProvince(data.shippingProvince || "");
      setEditShippingPostal(data.shippingPostal || "");
      setEditShippingCountry(data.shippingCountry || "South Africa");
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!orderData) return;

    setIsUpdatingOrder(true);
    try {
      // Convert UNSELECTED back to null for API
      const updateData = {
        status: editStatus !== UNSELECTED ? editStatus : undefined,
        paymentStatus:
          editPaymentStatus !== UNSELECTED ? editPaymentStatus : undefined,
        assignedTo: editAssignedTo !== UNSELECTED ? editAssignedTo : null,
        carrier: editCarrier !== UNSELECTED ? editCarrier : null,
        deliveryDate: editDeliveryDate || null,
        customerAddress: editShippingAddress,
        customerCity: editShippingCity,
        customerProvince: editShippingProvince,
        customerPostalCode: editShippingPostal,
        customerCountry: editShippingCountry,
      };

      const response = await fetch(`/api/shop/orders/${params.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update order");

      await fetchOrder(); // Refresh data
      setIsEditDialogOpen(false);

      toast({
        title: "Order Updated",
        description: "Order details have been updated successfully",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancellingOrder(true);
    try {
      const response = await fetch(`/api/shop/orders/${params.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (!response.ok) throw new Error("Failed to cancel order");

      setIsDeleteDialogOpen(false);

      toast({
        title: "Order Cancelled",
        description: "The order has been cancelled",
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleSendEmail = async (type: EmailType, email?: string) => {
    if (!orderData) return;

    try {
      setIsSendingEmail(true);

      const targetEmail = orderData.customerEmail || email;
      if (!targetEmail) {
        toast({
          title: "Error",
          description: "No email address available for the customer",
          variant: "destructive",
        });
        return;
      }

      let result;

      if (type === "receipt") {
        // Generate receipt and send
        const receiptHTML = await receiptGenerator.generateReceiptForEmail({
          id: orderData.id,
          saleNumber: orderData.orderNumber,
          saleDate: orderData.orderDate,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          items: orderData.items,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          discountPercent: orderData.discountPercent,
          tax: 0,
          taxPercent: 0,
          total: orderData.total,
          paymentMethod: "CARD",
          amountReceived: orderData.total,
          change: 0,
        });

        result = await emailService.sendReceipt(
          targetEmail,
          receiptHTML,
          orderData.orderNumber
        );
      } else {
        // Send order update
        result = await emailService.sendOrderUpdate(
          targetEmail,
          orderData.orderNumber,
          orderData.status,
          orderData.carrier || ""
        );
      }

      if (result.success) {
        toast({
          title: "Email Sent",
          description: `${type === "receipt" ? "Receipt" : "Order update"} has been sent successfully`,
        });
        setEmailDialogOpen(false);
        setCustomerEmail(""); // Reset email input
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendReceipt = () => {
    if (!orderData?.customerEmail) {
      setEmailType("receipt");
      setEmailDialogOpen(true);
    } else {
      handleSendEmail("receipt");
    }
  };

  const handleSendUpdate = () => {
    if (!orderData?.customerEmail) {
      setEmailType("update");
      setEmailDialogOpen(true);
    } else {
      handleSendEmail("update");
    }
  };

  const handlePrintReceipt = async () => {
    if (!orderData) return;

    setIsPrintingReceipt(true);
    try {
      const response = await fetch(`/api/shop/orders/${orderData.id}/receipt`);
      if (!response.ok) throw new Error("Failed to generate receipt");

      const receiptHTML = await response.text();

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt for printing",
        variant: "destructive",
      });
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const handlePrintDeliveryNote = async () => {
    if (!orderData) return;

    setIsPrintingDeliveryNote(true);
    try {
      const deliveryNoteHTML = DeliveryNoteGenerator.generateDeliveryNoteHTML(
        orderData,
        companyInfo
      );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(deliveryNoteHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing delivery note:", error);
      toast({
        title: "Error",
        description: "Failed to generate delivery note",
        variant: "destructive",
      });
    } finally {
      setIsPrintingDeliveryNote(false);
    }
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!orderData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <Button asChild className="mt-4">
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <OrderHeader orderData={orderData} />

        <OrderActions
          orderData={orderData}
          onEdit={() => setIsEditDialogOpen(true)}
          onCancel={handleCancelOrder}
          onSendReceipt={handleSendReceipt}
          onSendUpdate={handleSendUpdate}
          onPrintReceipt={handlePrintReceipt}
          onPrintDeliveryNote={handlePrintDeliveryNote}
          isSendingEmail={isSendingEmail}
          isPrintingReceipt={isPrintingReceipt}
          isPrintingDeliveryNote={isPrintingDeliveryNote}
          isUpdating={isUpdatingOrder}
          isCancelling={isCancellingOrder}
        />
      </div>

      <OrderInfoCards orderData={orderData} />

      <OrderItemsTable orderData={orderData} />

      <OrderSummaryCards orderData={orderData} />

      <EmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        emailType={emailType}
        customerEmail={customerEmail}
        onCustomerEmailChange={setCustomerEmail}
        onSendEmail={handleSendEmail}
        isSending={isSendingEmail}
      />

      <EditOrderDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        orderData={orderData}
        employees={employees}
        editStatus={editStatus}
        editPaymentStatus={editPaymentStatus}
        editAssignedTo={editAssignedTo}
        editCarrier={editCarrier}
        editDeliveryDate={editDeliveryDate}
        editShippingAddress={editShippingAddress}
        editShippingCity={editShippingCity}
        editShippingProvince={editShippingProvince}
        editShippingPostal={editShippingPostal}
        editShippingCountry={editShippingCountry}
        onEditStatusChange={setEditStatus}
        onEditPaymentStatusChange={setEditPaymentStatus}
        onEditAssignedToChange={setEditAssignedTo}
        onEditCarrierChange={setEditCarrier}
        onEditDeliveryDateChange={setEditDeliveryDate}
        onEditShippingAddressChange={setEditShippingAddress}
        onEditShippingCityChange={setEditShippingCity}
        onEditShippingProvinceChange={setEditShippingProvince}
        onEditShippingPostalChange={setEditShippingPostal}
        onEditShippingCountryChange={setEditShippingCountry}
        onUpdate={handleUpdateOrder}
        isUpdating={isUpdatingOrder}
      />

      <CancelOrderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
