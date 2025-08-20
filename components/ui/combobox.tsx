"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const Combobox = ({
  options,
  value,
  onChange,
  isLoading = false,
  placeholder = "Select option...",
  disabled = false,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOptionLabel = React.useMemo(() => {
    if (isLoading) return "Loading...";
    return value
      ? options.find((option) => option.value === value)?.label
      : placeholder;
  }, [options, value, placeholder, isLoading]);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full">
      {/* Combobox Trigger */}
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "ring-2 ring-ring ring-offset-2" : ""
        }`}
        onClick={() => !disabled && !isLoading && setOpen(!open)}
        disabled={disabled || isLoading}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            selectedOptionLabel
          )}
        </span>
        {!isLoading && (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md bg-popover text-popover-foreground shadow-lg"
          onBlur={(e) => {
            // Don't close if clicking on the combobox button
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setOpen(false);
            }
          }}
          tabIndex={-1}
        >
          {/* Search */}
          <div className="p-1">
            <input
              type="text"
              placeholder="Search options..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading options...</span>
              </div>
            ) : filteredOptions.length > 0 ? (
              <ul role="listbox">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    className={`relative flex cursor-default select-none items-center px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                      value === option.value ? "bg-accent/50" : ""
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === option.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="truncate">{option.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="relative cursor-default select-none px-3 py-2 text-sm text-muted-foreground">
                {searchTerm
                  ? "No matching options found"
                  : "No options available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
