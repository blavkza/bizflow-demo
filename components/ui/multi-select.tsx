// components/ui/multi-select.tsx
import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select...",
  disabled = false,
  loading = false,
  maxCount = 3,
}: MultiSelectProps & { maxCount?: number }) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected],
  );

  const isAllSelected =
    options.length > 0 && selected.length === options.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
          disabled={disabled || loading}
        >
          <div className="flex gap-1 flex-wrap items-center">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selected.length > 0 ? (
              <>
                {isAllSelected ? (
                  <Badge variant="secondary">
                    All {selected.length} Selected
                  </Badge>
                ) : (
                  <>
                    {selectedOptions.slice(0, maxCount).map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="max-w-[calc(100%-8px)]"
                      >
                        <span className="truncate max-w-[150px] block">
                          {option.label}
                        </span>
                      </Badge>
                    ))}
                    {selected.length > maxCount && (
                      <Badge
                        variant="secondary"
                        className="bg-muted-foreground/20 hover:bg-muted-foreground/30"
                      >
                        +{selected.length - maxCount} more
                      </Badge>
                    )}
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder="Search..." />
          {loading ? (
            <div className="py-6 text-center text-sm">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              <p className="mt-2">Loading options...</p>
            </div>
          ) : (
            <>
              <CommandEmpty>No item found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  onSelect={toggleSelectAll}
                  className="font-semibold border-b"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.length === options.length
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  Select All
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
