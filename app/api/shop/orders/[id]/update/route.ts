import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

async function sendOrderUpdateEmail(
  customerEmail: string,
  orderNumber: string,
  status: string,
  deliveryDate?: string | null,
  trackingNumber?: string | null,
  carrier?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/shop/sales/send-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order Update - ${orderNumber}`,
          html: generateOrderUpdateHTML(
            orderNumber,
            status,
            deliveryDate,
            trackingNumber,
            carrier
          ),
          saleNumber: orderNumber,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending order update email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

function generateOrderUpdateHTML(
  orderNumber: string,
  status: string,
  deliveryDate?: string | null,
  trackingNumber?: string | null,
  carrier?: string | null
): string {
  const statusConfig: { [key: string]: { message: string; color: string } } = {
    PENDING: {
      message:
        "Your order has been received and is being processed. We'll notify you when it's confirmed.",
      color: "#f59e0b",
    },
    CONFIRMED: {
      message:
        "Your order has been confirmed and is being prepared for shipment.",
      color: "#3b82f6",
    },
    PROCESSING: {
      message: "Your order is currently being processed in our warehouse.",
      color: "#8b5cf6",
    },
    SHIPPED: {
      message: "Your order has been shipped and is on its way to you.",
      color: "#6366f1",
    },
    DELIVERED: {
      message: "Your order has been delivered. Thank you for your purchase!",
      color: "#10b981",
    },
    CANCELLED: {
      message: "Your order has been cancelled as requested.",
      color: "#ef4444",
    },
  };

  const statusInfo = statusConfig[status] || {
    message: "Your order status has been updated.",
    color: "#6b7280",
  };

  const formattedDeliveryDate = deliveryDate
    ? new Date(deliveryDate).toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-bottom: 10px;">Order Update</h1>
        <p style="color: #666; font-size: 16px;">Your order status has been updated</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          Order #${orderNumber}
        </h2>
        
        <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid ${statusInfo.color};">
          <div>
            <strong style="color: #333;">Status:</strong>
            <span style="color: ${statusInfo.color}; font-weight: bold; margin-left: 8px;">${status}</span>
          </div>
        </div>

        ${
          formattedDeliveryDate
            ? `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Estimated Delivery Date:</strong>
            <span style="color: #059669; font-weight: bold; margin-left: 8px;">${formattedDeliveryDate}</span>
          </div>
        `
            : ""
        }

        ${
          trackingNumber
            ? `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Tracking Number:</strong>
            <span style="color: #2563eb; font-weight: bold; margin-left: 8px; font-family: monospace;">${trackingNumber}</span>
          </div>
        `
            : ""
        }

        ${
          carrier
            ? `
          <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Carrier:</strong>
            <span style="color: #7c3aed; font-weight: bold; margin-left: 8px;">${carrier}</span>
          </div>
        `
            : ""
        }
      </div>
      
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-bottom: 12px;">Update Details</h3>
        <p style="color: #047857; line-height: 1.6; margin: 0;">${statusInfo.message}</p>
        
        ${
          status === "SHIPPED" && trackingNumber
            ? `
          <div style="margin-top: 15px; padding: 12px; background: #d1fae5; border-radius: 4px;">
            <p style="color: #065f46; margin: 0; font-size: 14px;">
              <strong>Tracking:</strong> You can track your package using the tracking number above.
            </p>
          </div>
        `
            : ""
        }
        
        ${
          status === "DELIVERED"
            ? `
          <div style="margin-top: 15px; padding: 12px; background: #d1fae5; border-radius: 4px;">
            <p style="color: #065f46; margin: 0; font-size: 14px;">
              <strong>Delivery Confirmation:</strong> Your order has been successfully delivered. 
              If you have any issues with your delivery, please contact us within 24 hours.
            </p>
          </div>
        `
            : ""
        }
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          If you have any questions about your order, please contact our customer service team.
        </p>
      </div>
    </div>
  `;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      paymentStatus,
      assignedTo,
      carrier,
      deliveryDate,
      customerAddress,
      customerCity,
      customerProvince,
      customerPostalCode,
      customerCountry,
    } = body;

    // Track changes for email notification
    let shouldSendEmail = false;
    let emailReason = "";
    let emailData: {
      customerEmail: string;
      orderNumber: string;
      status: string;
      deliveryDate?: string;
      trackingNumber?: string;
      carrier?: string;
    } | null = null;

    // Start a transaction ONLY for database operations
    const result = await db.$transaction(
      async (tx) => {
        // Get the order first to check if it has a customer and track changes
        const previousOrder = await tx.order.findUnique({
          where: { id: params.id },
          include: { Customer: true },
        });

        if (!previousOrder) {
          throw new Error("Order not found");
        }

        // Check if status or delivery date changed
        const statusChanged = status && status !== previousOrder.status;
        const deliveryDateChanged =
          deliveryDate &&
          new Date(deliveryDate).toISOString() !==
            previousOrder.deliveryDate?.toISOString();
        const carrierChanged = carrier && carrier !== previousOrder.carrier;

        // Determine if we should send email and why
        if (statusChanged) {
          shouldSendEmail = true;
          emailReason = `status changed to ${status}`;
        } else if (deliveryDateChanged) {
          shouldSendEmail = true;
          emailReason = "delivery date updated";
        } else if (carrierChanged && status === "SHIPPED") {
          shouldSendEmail = true;
          emailReason = "carrier information updated";
        }

        // Update order fields
        const updatedOrder = await tx.order.update({
          where: {
            id: params.id,
          },
          data: {
            status,
            assignedTo: assignedTo === "UNSELECTED" ? null : assignedTo,
            carrier: carrier === "UNSELECTED" ? null : carrier,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
            ...(status === "DELIVERED" && !previousOrder.deliveryDate
              ? { deliveryDate: new Date() }
              : {}),
          },
        });

        // Update customer address if customer exists and address data is provided
        if (
          previousOrder.Customer &&
          (customerAddress ||
            customerCity ||
            customerProvince ||
            customerPostalCode ||
            customerCountry)
        ) {
          await tx.customer.update({
            where: {
              id: previousOrder.Customer.id,
            },
            data: {
              ...(customerAddress && { address: customerAddress }),
              ...(customerCity && { city: customerCity }),
              ...(customerProvince && { province: customerProvince }),
              ...(customerPostalCode && { postalCode: customerPostalCode }),
              ...(customerCountry && { country: customerCountry }),
            },
          });
        }

        // Update sale payment status if provided
        if (paymentStatus && previousOrder.saleId) {
          await tx.sale.update({
            where: {
              id: previousOrder.saleId,
            },
            data: {
              paymentStatus,
            },
          });
        }

        // Get the updated order with relations for response
        const completeOrder = await tx.order.findUnique({
          where: { id: params.id },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Customer: true,
          },
        });

        // Get assigned employee if exists
        let assignedEmployee = null;
        if (updatedOrder.assignedTo) {
          assignedEmployee = await tx.employee.findUnique({
            where: {
              id: updatedOrder.assignedTo,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          });
        }

        // Prepare email data but don't send it inside transaction
        if (shouldSendEmail && completeOrder?.Customer?.email) {
          emailData = {
            customerEmail: completeOrder.Customer.email,
            orderNumber: completeOrder.orderNumber,
            status: updatedOrder.status,
            deliveryDate: updatedOrder.deliveryDate?.toISOString(),
            trackingNumber: updatedOrder.trackingNumber || undefined,
            carrier: updatedOrder.carrier || undefined,
          };
        }

        return {
          order: completeOrder,
          assignedEmployee: assignedEmployee
            ? {
                id: assignedEmployee.id,
                name: `${assignedEmployee.firstName} ${assignedEmployee.lastName}`,
                email: assignedEmployee.email,
                phone: assignedEmployee.phone,
              }
            : null,
          processedBy: completeOrder?.User
            ? {
                id: completeOrder.User.id,
                name: completeOrder.User.name,
                email: completeOrder.User.email,
              }
            : null,
          emailData,
          emailReason: shouldSendEmail ? emailReason : null,
        };
      },
      {
        // Increase timeout for the transaction
        maxWait: 10000, // 10 seconds
        timeout: 15000, // 15 seconds
      }
    );

    // Send email AFTER the transaction is complete
    if (result.emailData) {
      try {
        const emailResult = await sendOrderUpdateEmail(
          result.emailData.customerEmail,
          result.emailData.orderNumber,
          result.emailData.status,
          result.emailData.deliveryDate,
          result.emailData.trackingNumber,
          result.emailData.carrier
        );

        if (emailResult.success) {
          console.log(
            `Order update email sent for order ${result.emailData.orderNumber}: ${result.emailReason}`
          );
        } else {
          console.warn(
            `Failed to send order update email for order ${result.emailData.orderNumber}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error("Error in email sending process:", emailError);
        // Don't throw error here - email failure shouldn't affect the API response
      }
    }

    // Return the order data without email status
    return NextResponse.json({
      ...result.order,
      assignedEmployee: result.assignedEmployee,
      processedBy: result.processedBy,
    });
  } catch (error) {
    console.error("Error updating order:", error);

    // Handle specific Prisma errors
    if (error instanceof Error && "code" in error && error.code === "P2028") {
      return NextResponse.json(
        { error: "Operation timed out. Please try again." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
