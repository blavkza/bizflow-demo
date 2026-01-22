import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpensesDateFilterProps {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onClear: () => void;
}

export default function ExpensesDateFilter({
  dateRange,
  onDateRangeChange,
  onClear,
}: ExpensesDateFilterProps) {
  const handlePresetChange = (value: string) => {
    const today = new Date();

    switch (value) {
      case "today":
        onDateRangeChange(today, today);
        break;
      case "thisWeek": {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        onDateRangeChange(firstDayOfWeek, today);
        break;
      }
      case "thisMonth": {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        onDateRangeChange(firstDayOfMonth, today);
        break;
      }
      case "lastMonth": {
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        onDateRangeChange(firstDayOfLastMonth, lastDayOfLastMonth);
        break;
      }
      case "thisYear": {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        onDateRangeChange(firstDayOfYear, today);
        break;
      }
      case "all":
        onClear();
        break;
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from || new Date()}
              selected={{
                from: dateRange.from || undefined,
                to: dateRange.to || undefined,
              }}
              onSelect={(range) =>
                onDateRangeChange(range?.from || null, range?.to || null)
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Quick filters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="thisWeek">This week</SelectItem>
          <SelectItem value="thisMonth">This month</SelectItem>
          <SelectItem value="lastMonth">Last month</SelectItem>
          <SelectItem value="thisYear">This year</SelectItem>
        </SelectContent>
      </Select>

      {(dateRange.from || dateRange.to) && (
        <Button variant="ghost" onClick={onClear} size="sm">
          Clear
        </Button>
      )}

      <div className="ml-auto text-sm text-muted-foreground">
        Showing{" "}
        {dateRange.from && dateRange.to
          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
          : "all dates"}
      </div>
    </div>
  );
}
