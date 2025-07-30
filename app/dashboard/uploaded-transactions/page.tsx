// app/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import { DashboardHeader } from "./_components/DashboardHeader";
import { TransactionTable } from "./_components/TransactionTable";
import { BankStatementUpload } from "./_components/BankStatementUpload";
import { Transaction } from "./_components/TransactionRow";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_TRANSACTIONS } from "@/lib/mockProducts";

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

    // 🧾 Log file before sending
    console.log("📄 File to upload:");
    console.log("Name:", file.name);
    console.log("Type:", file.type);
    console.log("Size:", file.size);
    console.log("Last Modified:", new Date(file.lastModified).toLocaleString());

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("✅ Parsed PDF:", data);
    } catch (err) {
      console.error("❌ Upload error:", err);
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
