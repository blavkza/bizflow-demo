"use client";

import React, { useState } from "react";
import { DashboardHeader } from "./_components/DashboardHeader";
import { TransactionTable } from "./_components/TransactionTable";
import { BankStatementUpload } from "./_components/BankStatementUpload";
import { Transaction } from "./_components/TransactionRow";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_TRANSACTIONS } from "@/lib/mockProducts";

interface PdfParseResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  pageCount: number;
  text: string;
  previewText: string;
}

const Page = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleTransactionUpdate = (updatedTransactions: Transaction[]) => {
    setTransactions(updatedTransactions);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data: PdfParseResult = await res.json();
      console.log("Parsed PDF:", data);

      toast({
        title: "PDF processed successfully",
        description: `Processed ${data.pageCount} pages from ${data.fileName}`,
      });

      return data;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process the PDF file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader transactions={transactions} />
        <BankStatementUpload
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
        />
        <TransactionTable
          transactions={transactions}
          onTransactionUpdate={handleTransactionUpdate}
        />
      </div>
    </div>
  );
};

export default Page;
