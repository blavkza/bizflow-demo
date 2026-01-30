"use client";

import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Clock, Users, UserPlus, Trash2, CheckCircle2 } from "lucide-react";
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

interface Freelancer {
  id: string;
  firstName: string;
  lastName: string;
  freeLancerNumber: string;
  position: string;
  department: string;
}

interface AttendanceEntry {
  freelancerId: string;
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
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [commonCheckIn, setCommonCheckIn] = useState("08:00");
  const [commonCheckOut, setCommonCheckOut] = useState("17:00");

  useEffect(() => {
    if (open) {
      fetchFreelancers();
    }
  }, [open]);

  const fetchFreelancers = async () => {
    try {
      setIsFetching(true);
      const res = await fetch("/api/freelancers");
      if (res.ok) {
        const data = await res.json();
        const list = data.freelancers || [];
        // De-duplicate by ID just in case the API or DB has issues
        const uniqueList = Array.from(new Map(list.map((f: Freelancer) => [f.id, f]) ).values()) as Freelancer[];
        setFreelancers(uniqueList);
      }
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      toast.error("Failed to load freelancers");
    } finally {
      setIsFetching(false);
    }
  };

  const toggleFreelancer = (id: string) => {
    const isSelected = selectedFreelancers.includes(id);
    
    if (isSelected) {
      setSelectedFreelancers(prev => prev.filter(i => i !== id));
      setEntries(prev => prev.filter(e => e.freelancerId !== id));
    } else {
      const freelancer = freelancers.find((f) => f.id === id);
      if (freelancer) {
        setSelectedFreelancers(prev => [...prev, id]);
        setEntries(prev => {
          // Double check to prevent duplicates in entries
          if (prev.some(e => e.freelancerId === id)) return prev;
          return [
            ...prev,
            {
              freelancerId: id,
              name: `${freelancer.firstName} ${freelancer.lastName}`,
              checkIn: commonCheckIn,
              checkOut: commonCheckOut,
            },
          ];
        });
      }
    }
  };

  const applyCommonTimes = () => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        checkIn: commonCheckIn,
        checkOut: commonCheckOut,
      }))
    );
    toast.success("Applied times to all entries");
  };

  const updateEntryTime = (id: string, field: "checkIn" | "checkOut", value: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.freelancerId === id ? { ...entry, [field]: value } : entry))
    );
  };

  const removeEntry = (id: string) => {
    setSelectedFreelancers((prev) => prev.filter((i) => i !== id));
    setEntries((prev) => prev.filter((e) => e.freelancerId !== id));
  };

  const handleSubmit = async () => {
    if (entries.length === 0) {
      toast.error("Please select at least one freelancer");
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        date: format(date, "yyyy-MM-dd"),
        entries: entries.map((e) => {
          const entryDate = format(date, "yyyy-MM-dd");
          return {
            freelancerId: e.freelancerId,
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
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Bulk Past Attendance (Freelancers)
          </DialogTitle>
          <DialogDescription>
            Record attendance for multiple freelancers for a specific past date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0 border-t border-b mt-4">
          {/* Left Panel: Picker */}
          <div className="w-full md:w-1/3 border-r bg-slate-50 p-4 space-y-4 flex flex-col">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border shadow-md" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <Label className="flex justify-between items-center">
                Select Freelancers
                <span className="text-[10px] text-muted-foreground bg-white px-1.5 py-0.5 rounded border">
                  {selectedFreelancers.length} selected
                </span>
              </Label>
              <Input 
                placeholder="Search freelancer..." 
                className="text-xs h-8 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScrollArea className="flex-1 h-[200px] border rounded-md bg-white">
                <div className="p-2 space-y-1">
                  {isFetching ? (
                    <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Loading...</div>
                  ) : freelancers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">No freelancers found</div>
                  ) : (
                    freelancers
                      .filter(f => 
                        `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.freeLancerNumber.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((f) => (
                        <div
                          key={f.id}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors",
                            selectedFreelancers.includes(f.id) && "bg-primary/5 hover:bg-primary/10 border-primary/20"
                          )}
                          onClick={() => toggleFreelancer(f.id)}
                        >
                          <Checkbox checked={selectedFreelancers.includes(f.id)} id={`free-${f.id}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{f.firstName} {f.lastName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{f.position} • {f.department}</p>
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
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Common In</Label>
                    <Input 
                      type="time" 
                      className="h-8 text-xs" 
                      value={commonCheckIn} 
                      onChange={(e) => setCommonCheckIn(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Common Out</Label>
                    <Input 
                      type="time" 
                      className="h-8 text-xs" 
                      value={commonCheckOut} 
                      onChange={(e) => setCommonCheckOut(e.target.value)} 
                    />
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-5 h-8 text-[11px]"
                  onClick={applyCommonTimes}
                  disabled={selectedFreelancers.length === 0}
                >
                  Apply to All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {entries.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <Users className="h-12 w-12 mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No freelancers selected</p>
                  <p className="text-xs text-muted-foreground">Select freelancers from the left to start editing</p>
                </div>
              ) : (
                <div className="space-y-3 pb-8">
                  {entries.map((entry) => (
                    <div key={entry.freelancerId} className="flex items-end gap-3 p-3 border rounded-lg hover:border-primary/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs font-semibold block mb-1.5 truncate">{entry.name}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                              <Clock className="h-2 w-2" /> In
                            </span>
                            <Input 
                              type="time" 
                              value={entry.checkIn} 
                              className="h-8 text-sm"
                              onChange={(e) => updateEntryTime(entry.freelancerId, "checkIn", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                              <Clock className="h-2 w-2" /> Out
                            </span>
                            <Input 
                              type="time" 
                              value={entry.checkOut} 
                              className="h-8 text-sm"
                              onChange={(e) => updateEntryTime(entry.freelancerId, "checkOut", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeEntry(entry.freelancerId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/80 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || entries.length === 0} className="min-w-[120px]">
            {isLoading ? "Submitting..." : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Submit {entries.length} Entries
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
