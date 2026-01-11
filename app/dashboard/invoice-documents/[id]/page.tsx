// app/dashboard/invoice-documents/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceDocumentPreview } from "./_components/InvoiceDocumentPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";
import { useAuth } from "@clerk/nextjs";

export default function InvoiceDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();

  const [document, setDocument] = useState<InvoiceDocumentWithRelations | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/documents/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const data = await response.json();
        setDocument(data.document);

        if (userId && data.document.createdBy === userId) {
          setCanEdit(true);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
        toast.error("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id, userId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/invoice-documents")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            {error || "Document not found"}
          </h2>
          <p className="text-muted-foreground">
            The document you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <InvoiceDocumentPreview document={document} canEdit={false} />
    </div>
  );
}
