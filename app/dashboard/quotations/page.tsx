"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { QuotationStats } from "./_components/QuotationStats";
import { CreateQuotationDialog } from "./_components/CreateQuotationDialog";
import { QuotationTable } from "./_components/QuotationTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUOTATION_SORT_OPTIONS,
  QUOTATION_STATUS_OPTIONS,
} from "@/lib/constants/quotation";
import Header from "./_components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { QuotationWithRelations } from "@/types/quotation";
import QuotationsLoading from "./_components/loading";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationWithRelations[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<
    QuotationWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const response =
          await axios.get<QuotationWithRelations[]>("/api/quotations");
        setQuotations(response.data);
        setFilteredQuotations(response.data);
      } catch (err) {
        console.error("Failed to fetch quotations:", err);
        setError("Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  useEffect(() => {
    let results = [...quotations];

    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter((q) => q.status === statusFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (q) =>
          q.title?.toLowerCase().includes(query) ||
          q.description?.toLowerCase().includes(query) ||
          q.quotationNumber.toLowerCase().includes(query) ||
          q.client?.name?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        results.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "amount-high":
        results.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
        break;
      case "amount-low":
        results.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
        break;
      default:
        break;
    }

    setFilteredQuotations(results);
  }, [quotations, statusFilter, sortOption, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Header />
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (loading) {
    return <QuotationsLoading />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header />
      <QuotationStats quotations={quotations} />

      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {QUOTATION_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {QUOTATION_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationTable quotations={filteredQuotations} />
        </CardContent>
      </Card>
    </div>
  );
}
