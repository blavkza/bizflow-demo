import { NextRequest, NextResponse } from "next/server";
import {
  InvoiceDocumentType,
  DocumentStatus,
  DiscountType,
  InvoiceStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@prisma/client";
import { z } from "zod";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const CreateCreditNoteSchema = z.object({
  creditNoteNumber: z.string().optional(),
  description: z.string().optional(),
  reason: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.coerce.number().min(0, "Quantity must be positive"),
        unitPrice: z.coerce.number().min(0, "Price must be positive"),
        taxRate: z.coerce.number().optional(),
        productId: z.string().optional().nullable(),
        serviceId: z.string().optional().nullable(),
        discountType: z.enum(["AMOUNT", "PERCENTAGE"]).optional(),
        discountAmount: z.coerce.number().optional(),
        notes: z.string().optional(),
        originalInvoiceItemId: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  refundMethod: z
    .enum(["BANK_TRANSFER", "CREDIT_CARD", "CASH", "CHEQUE", "OTHER"])
    .default("BANK_TRANSFER"),
  refundDate: z.string().datetime().optional(),
  accountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("No userId found - Unauthorized");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const session = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, email: true },
    });

    if (!session) {
      console.log("No session found for userId:", userId);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and log request body
    const bodyText = await req.text();

    let body;
    try {
      body = JSON.parse(bodyText);
      console.log("Parsed body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error",
        },
        { status: 400 }
      );
    }

    // Validate data
    console.log("Validating request data...");
    let validatedData;
    try {
      validatedData = CreateCreditNoteSchema.parse(body);
      console.log(
        "Validation successful:",
        JSON.stringify(validatedData, null, 2)
      );
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Validation errors:", validationError.errors);
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
              code: e.code,
            })),
            message: validationError.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const invoiceId = params.id;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required in URL parameters" },
        { status: 400 }
      );
    }

    // Fetch the original invoice
    const originalInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!originalInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify invoice is not already fully credited
    if (
      originalInvoice.status === "CANCELLED" ||
      originalInvoice.status === "REFUNDED"
    ) {
      console.log("Invoice already cancelled or refunded");
      return NextResponse.json(
        { error: "Invoice is already cancelled or refunded" },
        { status: 400 }
      );
    }

    // Calculate credit note totals
    let subtotal = 0;
    let totalTax = 0;
    let discountAmount = 0;

    const itemsWithCalculations = validatedData.items.map((item, index) => {
      const quantity = item.quantity;
      const unitPrice = item.unitPrice;
      const taxRate = item.taxRate || 15;

      const baseAmount = quantity * unitPrice;

      // Calculate item discount
      let itemDiscount = 0;
      if (item.discountType && item.discountAmount) {
        console.log(`  Discount: ${item.discountType} ${item.discountAmount}`);
        if (item.discountType === "PERCENTAGE") {
          itemDiscount = baseAmount * (item.discountAmount / 100);
        } else {
          itemDiscount = item.discountAmount;
        }
      }

      const amountAfterDiscount = Math.max(0, baseAmount - itemDiscount);
      const taxAmount = amountAfterDiscount * (taxRate / 100);
      const itemTotal = amountAfterDiscount + taxAmount;

      subtotal += baseAmount;
      discountAmount += itemDiscount;
      totalTax += taxAmount;

      return {
        ...item,
        amount: itemTotal,
        taxAmount,
      };
    });

    const totalAmount = subtotal - discountAmount + totalTax;

    // Generate credit note number if not provided
    const creditNoteNumber =
      validatedData.creditNoteNumber ||
      `CN-${originalInvoice.invoiceNumber}-${Date.now().toString().slice(-6)}`;

    console.log("Credit note number:", creditNoteNumber);

    // Find or create category outside transaction
    console.log("Finding/creating refund category...");
    let paymentCategory = await db.category.findFirst({
      where: { name: "Invoice Refund", type: "EXPENSE" },
    });

    if (!paymentCategory) {
      console.log("Creating new Invoice Refund category...");
      paymentCategory = await db.category.create({
        data: {
          name: "Invoice Refund",
          type: "EXPENSE",
          description: "Invoice Refund Transactions",
          createdBy: session.id,
        },
      });
      console.log("Category created:", paymentCategory.id);
    } else {
      console.log("Using existing category:", paymentCategory.id);
    }

    // Start transaction with increased timeout
    console.log("Starting database transaction...");
    const result = await db.$transaction(
      async (tx) => {
        console.log("Transaction started, creating credit note...");

        // Get all existing credit notes for this invoice to calculate total refunded amount
        const existingCreditNotes = await tx.invoiceDocument.findMany({
          where: {
            invoiceId: invoiceId,
            invoiceDocumentType: InvoiceDocumentType.CREDIT_NOTE,
          },
          select: {
            totalAmount: true,
          },
        });

        // Calculate total refunded amount including this new credit note
        const existingRefundTotal = existingCreditNotes.reduce(
          (sum, cn) => sum + cn.totalAmount.toNumber(),
          0
        );
        const totalRefundedAmount = existingRefundTotal + totalAmount;
        const originalInvoiceAmount = originalInvoice.totalAmount.toNumber();

        // Create the credit note (InvoiceDocument)
        const creditNote = await tx.invoiceDocument.create({
          data: {
            invoiceDocumentNumber: creditNoteNumber,
            invoiceDocumentType: InvoiceDocumentType.CREDIT_NOTE,
            status: DocumentStatus.DRAFT,
            invoiceId: invoiceId,
            clientId: originalInvoice.clientId,
            issueDate: validatedData.issueDate
              ? new Date(validatedData.issueDate)
              : new Date(),
            dueDate: validatedData.dueDate
              ? new Date(validatedData.dueDate)
              : new Date(new Date().setDate(new Date().getDate() + 30)),
            subtotal,
            taxAmount: totalTax,
            discountAmount,
            discountType: discountAmount > 0 ? DiscountType.AMOUNT : undefined,
            totalAmount,
            currency: originalInvoice.currency || "ZAR",
            referenceNumber: `Refunds for Invoice #${originalInvoice.invoiceNumber}`,
            invoiceNumber: originalInvoice.invoiceNumber,
            paymentTerms:
              validatedData.terms || originalInvoice.paymentTerms || "",
            notes:
              validatedData.notes ||
              validatedData.reason ||
              "Credit note issued",
            terms: validatedData.terms || "",
            createdBy: session.id,
            originalDocumentId: null,
            items: {
              create: itemsWithCalculations.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                currency: originalInvoice.currency || "ZAR",
                productId: item.productId || null,
                serviceId: item.serviceId || null,
                taxRate: item.taxRate || 15,
                taxAmount: item.taxAmount,
                unitOfMeasure: "Kg",
                deliveredQuantity: 0,
              })),
            },
          },
          include: {
            client: true,
            items: true,
          },
        });

        console.log("Credit note created:", creditNote.id);

        // Create expense transaction for the refund amount
        console.log("Creating refund transaction...");
        const refundTransaction = await tx.transaction.create({
          data: {
            amount: totalAmount,
            currency: originalInvoice.currency || "ZAR",
            type: TransactionType.EXPENSE,
            status: TransactionStatus.COMPLETED,
            description: `Refund for Invoice #${originalInvoice.invoiceNumber} - Credit Note ${creditNoteNumber}`,
            reference: `REF-${originalInvoice.invoiceNumber}-${creditNoteNumber}`,
            date: validatedData.refundDate
              ? new Date(validatedData.refundDate)
              : new Date(),
            method:
              (validatedData.refundMethod as PaymentMethod) ||
              PaymentMethod.INVOICE,
            invoiceId: originalInvoice.id,
            clientId: originalInvoice.clientId,
            accountId: validatedData.accountId || null,
            categoryId: paymentCategory.id,
            createdBy: session.id,
            taxAmount: totalTax,
            taxRate: 0,
            netAmount: subtotal - discountAmount,
            invoiceNumber: originalInvoice.invoiceNumber,
            receiptUrl: null,
            isReconciled: false,
          },
        });

        let notesAddition = "";
        let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_REFUNDED;

        if (Math.abs(totalRefundedAmount) >= originalInvoiceAmount) {
          notesAddition = `Credit note ${creditNoteNumber} issued. Total refunded amount: ${Math.abs(totalRefundedAmount)}. Refund transaction: ${refundTransaction.id}`;
          newStatus = InvoiceStatus.REFUNDED;
        } else {
          notesAddition = `Credit note ${creditNoteNumber} issued for amount of ${Math.abs(totalAmount)}. Total refunded: ${Math.abs(totalRefundedAmount)}. Refund transaction: ${refundTransaction.id}`;
          newStatus = InvoiceStatus.PARTIALLY_REFUNDED;
        }

        await tx.invoice.update({
          where: { id: originalInvoice.id },
          data: {
            status: newStatus,
            notes: originalInvoice.notes
              ? `${originalInvoice.notes}\n${notesAddition}`
              : notesAddition,
          },
        });

        console.log(`Invoice status updated to ${newStatus}`);

        // Update account balance if needed
        if (validatedData.accountId) {
          console.log(
            "Updating account balance for account:",
            validatedData.accountId
          );
          await tx.account.update({
            where: { id: validatedData.accountId },
            data: {
              balance: {
                decrement: totalAmount,
              },
            },
          });
          console.log("Account balance updated");
        }

        console.log("Transaction completed successfully");
        return { creditNote, refundTransaction };
      },
      {
        maxWait: 15000,
        timeout: 45000, // Increased to 45 seconds
      }
    );

    console.log("=== CREDIT NOTE API SUCCESS ===");
    return NextResponse.json(
      {
        success: true,
        message: "Credit note and refund transaction created successfully",
        creditNote: result.creditNote,
        refundTransaction: result.refundTransaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("=== CREDIT NOTE API ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error instanceof z.ZodError) {
      console.error("Zod validation error details:", error.errors);
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
          message: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error.code) {
      console.error("Database error code:", error.code);
      console.error("Database error meta:", error.meta);
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to create credit note",
        code: error.code,
        meta: error.meta,
      },
      { status: 500 }
    );
  }
}
