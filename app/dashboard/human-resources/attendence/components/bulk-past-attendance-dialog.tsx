"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface BulkPastAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  department: string;
  type: "employee" | "freelancer" | "trainee";
}

interface AttendanceEntry {
  workerId: string;
  workerType: "employee" | "freelancer" | "trainee";
  name: string;
  checkIn: string;
  checkOut: string;
}

export function BulkPastAttendanceDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkPastAttendanceDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [workerTypeFilter, setWorkerTypeFilter] = useState<
    "all" | "employee" | "freelancer" | "trainee"
  >("all");
  const [commonCheckIn, setCommonCheckIn] = useState("07:00");
  const [commonCheckOut, setCommonCheckOut] = useState("17:00");

  useEffect(() => {
    if (open) {
      fetchWorkers();
    }
  }, [open, date]); // Re-fetch when date changes!

  const fetchWorkers = async () => {
    try {
      setIsFetching(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      const res = await fetch(
        `/api/attendance/available-workers?date=${formattedDate}`,
      );
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers || []);

        // Clear selections that are no longer in the list (if date changed)
        const availableIds = new Set(data.workers.map((w: Worker) => w.id));
        setSelectedWorkerIds((prev) =>
          prev.filter((id) => availableIds.has(id)),
        );
        setEntries((prev) => prev.filter((e) => availableIds.has(e.workerId)));
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to load workers");
    } finally {
      setIsFetching(false);
    }
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(
      (w) =>
        (workerTypeFilter === "all" || w.type === workerTypeFilter) &&
        (`${w.firstName} ${w.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          w.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.position.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [workers, workerTypeFilter, searchTerm]);

  const toggleWorker = (id: string) => {
    const isSelected = selectedWorkerIds.includes(id);

    if (isSelected) {
      setSelectedWorkerIds((prev) => prev.filter((i) => i !== id));
      setEntries((prev) => prev.filter((e) => e.workerId !== id));
    } else {
      const worker = workers.find((w) => w.id === id);
      if (worker) {
        setSelectedWorkerIds((prev) => [...prev, id]);
        setEntries((prev) => {
          if (prev.some((e) => e.workerId === id)) return prev;
          return [
            ...prev,
            {
              workerId: id,
              workerType: worker.type,
              name: `${worker.firstName} ${worker.lastName}`,
              checkIn: commonCheckIn,
              checkOut: commonCheckOut,
            },
          ];
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = [...selectedWorkerIds];
      const newEntries = [...entries];

      filteredWorkers.forEach((worker) => {
        if (!newIds.includes(worker.id)) {
          newIds.push(worker.id);
          newEntries.push({
            workerId: worker.id,
            workerType: worker.type,
            name: `${worker.firstName} ${worker.lastName}`,
            checkIn: commonCheckIn,
            checkOut: commonCheckOut,
          });
        }
      });

      setSelectedWorkerIds(newIds);
      setEntries(newEntries);
    } else {
      const filteredIds = new Set(filteredWorkers.map((w) => w.id));
      setSelectedWorkerIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      setEntries((prev) =>
        prev.filter((entry) => !filteredIds.has(entry.workerId)),
      );
    }
  };

  const applyCommonTimes = () => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        checkIn: commonCheckIn,
        checkOut: commonCheckOut,
      })),
    );
    toast.success("Applied times to all entries");
  };

  const updateEntryTime = (
    id: string,
    field: "checkIn" | "checkOut",
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.workerId === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const removeEntry = (id: string) => {
    setSelectedWorkerIds((prev) => prev.filter((i) => i !== id));
    setEntries((prev) => prev.filter((e) => e.workerId !== id));
  };

  const handleSubmit = async () => {
    if (entries.length === 0) {
      toast.error("Please select at least one worker");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        date: format(date, "yyyy-MM-dd"),
        entries: entries.map((e) => {
          const entryDate = format(date, "yyyy-MM-dd");
          return {
            workerId: e.workerId,
            workerType: e.workerType,
            checkIn: `${entryDate}T${e.checkIn}:00`,
            checkOut: `${entryDate}T${e.checkOut}:00`,
          };
        }),
      };

      const res = await fetch("/api/attendance/bulk-past", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Bulk attendance updated successfully");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update bulk attendance");
      }
    } catch (error) {
      console.error("Bulk submission error:", error);
      toast.error("An error occurred during submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserPlus className="h-6 w-6 text-primary" />
            Bulk Past Attendance
          </DialogTitle>
          <DialogDescription className="text-sm">
            Record attendance for multiple employees, freelancers and trainees
            for a specific past date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0 border-t border-b mt-4">
          {/* Left Panel: Picker */}
          <div className="w-full md:w-1/3 border-r bg-slate-50 p-4 space-y-4 flex flex-col">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Select Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-primary/20 hover:border-primary/50 transition-all",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border shadow-2xl rounded-xl"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground pl-1 italic">
                * List will update to only show workers without records on this
                date
              </p>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <Label className="flex justify-between items-center text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Select Workers
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {selectedWorkerIds.length} selected
                </span>
              </Label>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setWorkerTypeFilter("all")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all",
                    workerTypeFilter === "all"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerTypeFilter("employee")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all",
                    workerTypeFilter === "employee"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  EMPLOYEES
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerTypeFilter("freelancer")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all",
                    workerTypeFilter === "freelancer"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  FREELANCERS
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerTypeFilter("trainee")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all",
                    workerTypeFilter === "trainee"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  TRAINEES
                </button>
              </div>

              <div className="relative">
                <Input
                  placeholder="Search name, position, or number..."
                  className="text-xs h-9 bg-white pr-8 border-primary/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-auto">
                    <Checkbox
                      id="mark-all"
                      className="h-3.5 w-3.5"
                      checked={
                        filteredWorkers.length > 0 &&
                        filteredWorkers.every((w) =>
                          selectedWorkerIds.includes(w.id),
                        )
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked === true)
                      }
                    />
                    <Label
                      htmlFor="mark-all"
                      className="text-[10px] font-bold text-primary cursor-pointer uppercase"
                    >
                      Mark All
                    </Label>
                  </div>
                  <Users className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
              <ScrollArea className="h-[350px] md:h-[450px] border rounded-lg bg-white shadow-inner">
                <div className="p-2 space-y-1">
                  {isFetching ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        Updating list...
                      </span>
                    </div>
                  ) : workers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <Users className="h-6 w-6 text-slate-300" />
                      </div>
                      <span>All workers have records for this date</span>
                    </div>
                  ) : filteredWorkers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <Users className="h-6 w-6 text-slate-300" />
                      </div>
                      <span className="capitalize">
                        {searchTerm
                          ? "No matching workers found"
                          : `No ${workerTypeFilter}s available for this date`}
                      </span>
                    </div>
                  ) : (
                    filteredWorkers.map((w) => (
                      <div
                        key={w.id}
                        className={cn(
                          "flex items-center space-x-2 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-all border border-transparent",
                          selectedWorkerIds.includes(w.id) &&
                            "bg-primary/5 border-primary/20 shadow-sm",
                        )}
                        onClick={() => toggleWorker(w.id)}
                      >
                        <Checkbox
                          checked={selectedWorkerIds.includes(w.id)}
                          id={`worker-${w.id}`}
                          className="h-4 w-4 border-primary/30"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate">
                              {w.firstName} {w.lastName}
                            </p>
                            <span
                              className={cn(
                                "text-[8px] px-1.5 py-0 rounded uppercase font-bold tracking-tighter",
                                w.type === "employee"
                                  ? "bg-blue-100 text-blue-700"
                                  : w.type === "freelancer"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700",
                              )}
                            >
                              {w.type === "employee"
                                ? "EMP"
                                : w.type === "freelancer"
                                  ? "FRL"
                                  : "TRN"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {w.position} • {w.department}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Panel: Editor */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                      Bulk Clock-In
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        className="h-9 text-xs pl-8 border-primary/10 focus-visible:ring-primary/20"
                        value={commonCheckIn}
                        onChange={(e) => setCommonCheckIn(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                      Bulk Clock-Out
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        className="h-9 text-xs pl-8 border-primary/10 focus-visible:ring-primary/20"
                        value={commonCheckOut}
                        onChange={(e) => setCommonCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 h-9 text-[11px] font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={applyCommonTimes}
                  disabled={selectedWorkerIds.length === 0}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  APPLY TO ALL
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 min-h-0">
              {entries.length === 0 ? (
                <div className="h-[350px] flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <div className="p-6 bg-slate-100 rounded-full mb-4">
                    <Users className="h-16 w-16 text-slate-300" />
                  </div>
                  <p className="text-base font-bold text-slate-600">
                    No workers selected
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Select employees, freelancers or trainees from the left
                    panel to start recording their attendance
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-8">
                  {entries.map((entry) => (
                    <div
                      key={entry.workerId}
                      className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-md transition-all group relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold truncate">
                              {entry.name}
                            </Label>
                            <span
                              className={cn(
                                "text-[7px] px-1 py-0.5 rounded-sm uppercase font-black tracking-tighter",
                                entry.workerType === "employee"
                                  ? "bg-blue-600 text-white"
                                  : entry.workerType === "freelancer"
                                    ? "bg-purple-600 text-white"
                                    : "bg-orange-600 text-white",
                              )}
                            >
                              {entry.workerType === "employee"
                                ? "EMPLOYEE"
                                : entry.workerType === "freelancer"
                                  ? "FREELANCER"
                                  : "TRAINEE"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => removeEntry(entry.workerId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase flex items-center gap-1 opacity-70">
                            <Clock className="h-2.5 w-2.5" /> Start
                          </span>
                          <Input
                            type="time"
                            value={entry.checkIn}
                            className="h-8 text-xs border-primary/5 bg-slate-50/30"
                            onChange={(e) =>
                              updateEntryTime(
                                entry.workerId,
                                "checkIn",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase flex items-center gap-1 opacity-70">
                            <Clock className="h-2.5 w-2.5" /> End
                          </span>
                          <Input
                            type="time"
                            value={entry.checkOut}
                            className="h-8 text-xs border-primary/5 bg-slate-50/30"
                            onChange={(e) =>
                              updateEntryTime(
                                entry.workerId,
                                "checkOut",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/80 border-t items-center gap-4">
          <div className="flex-1 hidden sm:block">
            {entries.length > 0 && (
              <p className="text-[11px] text-muted-foreground font-medium italic">
                * All entries will be recorded as{" "}
                <span className="font-bold text-primary">PRESENT</span> with{" "}
                <span className="font-bold text-primary">
                  AUTO-APPROVED OVERTIME
                </span>{" "}
                if applicable.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-6 h-11 text-xs font-bold"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || entries.length === 0}
              className="min-w-[180px] h-11 text-xs font-black tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  SUBMITTING...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  SUBMIT {entries.length} RECORDS
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


