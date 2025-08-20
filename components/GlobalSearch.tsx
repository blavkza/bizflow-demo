"use client";

import * as React from "react";
import { Search, Command } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>(
    []
  );
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load search history from localStorage
  React.useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to parse search history:", error);
      }
    }
  }, []);

  // Save search history to localStorage
  React.useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  // Debounced search function
  React.useEffect(() => {
    if (!open) return;

    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, open]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (response.ok) {
        setResults(data.results);

        // Add to search history
        if (searchQuery.trim().length > 0) {
          const newHistory = [
            { query: searchQuery, timestamp: Date.now() },
            ...searchHistory
              .filter((item) => item.query !== searchQuery)
              .slice(0, 9),
          ];
          setSearchHistory(newHistory);
        }
      } else {
        console.error("Search failed:", data.error);
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  const searchFromHistory = (historyQuery: string) => {
    setQuery(historyQuery);
    performSearch(historyQuery);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // Group results by type
  const groupedResults = results.reduce(
    (groups: Record<string, SearchResult[]>, result) => {
      const group = groups[result.type] || [];
      group.push(result);
      groups[result.type] = group;
      return groups;
    },
    {}
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs font-thin">Ctrl +</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search quotations, invoices, projects, clients..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : results.length === 0 && query ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : null}

          {!query && searchHistory.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {searchHistory.map((item, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => searchFromHistory(item.query)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>{item.query}</span>
                </CommandItem>
              ))}
              <CommandItem onSelect={clearSearchHistory}>
                <span className="text-muted-foreground">
                  Clear search history
                </span>
              </CommandItem>
            </CommandGroup>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup
              key={type}
              heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}
            >
              {items.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  <div className="flex flex-col py-2">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
