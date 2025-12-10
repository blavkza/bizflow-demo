"use client";

import * as React from "react";
import {
  Search,
  Clock,
  Building,
  Users,
  FileText,
  Briefcase,
  CreditCard,
  User,
  Receipt,
  Calendar,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  Wrench,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  href: string;
  metadata?: Record<string, any>;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

// Icons for different types (Matched to API types)
const typeIcons: Record<string, React.ReactNode> = {
  quotation: <FileText className="h-4 w-4" />,
  invoice: <Receipt className="h-4 w-4" />,
  project: <Briefcase className="h-4 w-4" />,
  client: <Users className="h-4 w-4" />,
  department: <Building className="h-4 w-4" />,
  employee: <User className="h-4 w-4" />,
  freelancer: <User className="h-4 w-4" />,
  transaction: <CreditCard className="h-4 w-4" />,
  leave: <Calendar className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />, // Fixed: "tool" matches API
  vendor: <Building className="h-4 w-4" />,
  expense: <CreditCard className="h-4 w-4" />,
  recurring_invoice: <FileText className="h-4 w-4" />,
  task: <Briefcase className="h-4 w-4" />,
  service: <Wrench className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  sale: <ShoppingCart className="h-4 w-4" />,
  order: <Truck className="h-4 w-4" />,
  refund: <RotateCcw className="h-4 w-4" />,
};

// Type labels for headers
const typeLabels: Record<string, string> = {
  quotation: "Quotations",
  invoice: "Invoices",
  project: "Projects",
  client: "Clients",
  department: "Departments",
  employee: "Employees",
  freelancer: "Freelancers",
  transaction: "Transactions",
  leave: "Leave Requests",
  tool: "Tools",
  vendor: "Vendors",
  expense: "Expenses",
  recurring_invoice: "Recurring Invoices",
  task: "Tasks",
  service: "Services",
  product: "Products",
  sale: "Sales",
  order: "Orders",
  refund: "Refunds",
};

// Order of display in the list
const typeOrder = [
  "client",
  "project",
  "task",
  "quotation",
  "invoice",
  "recurring_invoice",
  "sale",
  "order",
  "refund",
  "product",
  "service",
  "employee",
  "freelancer",
  "department",
  "transaction",
  "expense",
  "vendor",
  "tool",
  "leave",
];

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>(
    []
  );
  const router = useRouter();

  // Keyboard shortcut (Ctrl/Cmd + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load history from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) setSearchHistory(parsed.slice(0, 10));
        } catch (error) {
          console.error("Failed to parse search history:", error);
        }
      }
    }
  }, []);

  // Save history to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (searchHistory.length > 0) {
        localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
      } else {
        localStorage.removeItem("searchHistory");
      }
    }
  }, [searchHistory]);

  // Debounce Search
  React.useEffect(() => {
    if (!open || query.trim().length === 0) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, open]);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data.results || []);

      // Add to history
      if (searchQuery.trim().length > 0) {
        setSearchHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.query.toLowerCase() !== searchQuery.toLowerCase()
          );
          return [
            { query: searchQuery, timestamp: Date.now() },
            ...filtered.slice(0, 9),
          ];
        });
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const searchFromHistory = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (typeof window !== "undefined") localStorage.removeItem("searchHistory");
  };

  // Group results
  const groupedResults = React.useMemo(() => {
    const groups = results.reduce(
      (acc: Record<string, SearchResult[]>, result) => {
        const group = acc[result.type] || [];
        group.push(result);
        acc[result.type] = group;
        return acc;
      },
      {}
    );

    // Return objects sorted by typeOrder
    return typeOrder
      .filter((type) => groups[type] && groups[type].length > 0)
      .reduce((acc: Record<string, SearchResult[]>, type) => {
        acc[type] = groups[type];
        return acc;
      }, {});
  }, [results]);

  const formatMetadata = (result: SearchResult): string | null => {
    if (!result.metadata) return null;
    const m = result.metadata;
    switch (result.type) {
      case "quotation":
      case "invoice":
      case "transaction":
      case "expense":
        return m.amount
          ? `R${parseFloat(m.amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : null;
      case "project":
        return m.progress ? `${m.progress}%` : null;
      case "employee":
      case "freelancer":
        return m.employeeNumber || m.freelancerNumber || null;
      case "product":
        return m.stock ? `Stock: ${m.stock}` : null;
      case "sale":
      case "refund":
        return m.total || m.amount
          ? `R${parseFloat(m.total || m.amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : null;
      case "recurring_invoice":
        return m.frequency || null;
      default:
        return m.status || null;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:w-44 lg:w-60"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">ctrl +</span>K
        </kbd>
      </Button>

      {/* CRITICAL FIX: shouldFilter={false} 
         This tells Shadcn/CMDK NOT to filter results client-side.
         Since the API already filtered them, we want to show everything the API returned.
      */}
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search projects, invoices, clients..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[500px]">
          {isLoading && (
            <div className="py-6 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <CommandEmpty>No results found</CommandEmpty>
          )}

          {!isLoading && !query && searchHistory.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {searchHistory.map((item) => (
                <CommandItem
                  key={`${item.query}-${item.timestamp}`}
                  onSelect={() => searchFromHistory(item.query)}
                  className="cursor-pointer gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.query}</span>
                </CommandItem>
              ))}
              <CommandSeparator />
              <CommandItem
                onSelect={clearSearchHistory}
                className="cursor-pointer text-muted-foreground"
              >
                Clear search history
              </CommandItem>
            </CommandGroup>
          )}

          {!isLoading &&
            Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup key={type} heading={typeLabels[type] || type}>
                {items.map((result) => {
                  const metadataText = formatMetadata(result);
                  return (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer gap-3"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          getTypeColor(result.type)
                        )}
                      >
                        {typeIcons[result.type] || (
                          <Search className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {result.title}
                          </span>
                          {metadataText && (
                            <Badge
                              variant="outline"
                              className="ml-auto shrink-0 text-xs"
                            >
                              {metadataText}
                            </Badge>
                          )}
                        </div>
                        {result.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}

          {/* Results Count Footer */}
          {!isLoading && query && results.length > 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t mt-2">
              <div className="flex items-center justify-between">
                <span>
                  Found {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] hidden sm:inline">
                  Use ↑↓ to navigate • Enter to select
                </span>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    quotation: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    invoice:
      "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    project:
      "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    client:
      "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    department: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300",
    employee: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300",
    freelancer: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300",
    transaction:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
    leave: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    tool: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
    vendor: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
    expense: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
    recurring_invoice:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
    task: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
    service:
      "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900 dark:text-fuchsia-300",
    product: "bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-300",
    sale: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300",
    order: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
    refund: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
  };
  return (
    colors[type] ||
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  );
}
