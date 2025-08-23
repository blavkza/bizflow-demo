"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import Header from "./_components/Header";
import InvoicesFilterTable from "./_components/Invoices-Filter-Table";
import Stats from "./_components/Stats";
import Loading from "./_components/loading";
import { Client } from "@prisma/client";
import { FullInvoice } from "@/types/invoice";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<FullInvoice[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices/all-invoices");

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await response.json();

        setInvoices(data);
      } catch (err) {
        setError("Failed to fetch invoices");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!invoices) {
    return <div className="p-6">No invoice data available</div>;
  }

  return (
    <div className="p-6">
      <Header />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Summary Cards */}
        <Stats invoices={invoices} />

        {/* Controls */}
        <InvoicesFilterTable invoices={invoices} />
      </div>
    </div>
  );
}
