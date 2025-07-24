"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import Header from "./_components/Header";
import InvoicesFilterTable from "./_components/Invoices-Filter-Table";
import Stats from "./_components/Stats";
import Loading from "./_components/loading";

interface InvoiceData {
  rawInvoices: any[];
  statsData: {
    totalOutstanding: number;
    pendingInvoices: number;
    paidThisMonth: number;
    paidInvoices: number;
    overdueAmount: number;
    overdueInvoices: number;
    averageInvoice: number;
    totalInvoices: number;
  };
  tableData: {
    id: string;
    invoiceNumber: string;
    client: string;
    description: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    status: string;
  }[];
}

export default function InvoicesPage() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get<InvoiceData>(
          "/api/invoices/all-invoices"
        );
        setData(response.data);
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

  if (!data) {
    return <div className="p-6">No invoice data available</div>;
  }

  return (
    <div className="p-6">
      <Header />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Summary Cards */}
        <Stats {...data.statsData} />

        {/* Controls */}
        <InvoicesFilterTable invoices={data.tableData} />
      </div>
    </div>
  );
}
