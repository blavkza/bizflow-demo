"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, Plus, Trash2, Timer, Clock } from "lucide-react";
import { Task } from "@/types/tasks";
import { format, differenceInSeconds } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TimeTrackingTabProps {
  task: Task;
  refetch: () => void;
}

interface TimeEntry {
  id: string;
  hours: number | string | { toString?: () => string };
  description: string | null;
  date: Date;
  timeIn: Date;
  timeOut: Date | null;
  userId: string;
}

interface ActiveTimer {
  id: string;
  taskId: string;
  timeIn: Date;
  description: string;
}

export default function TimeTrackingTab({
  task,
  refetch,
}: TimeTrackingTabProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimerStart, setCurrentTimerStart] = useState<Date | null>(null);
  const [currentTimeEntryId, setCurrentTimeEntryId] = useState<string | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newEntryDescription, setNewEntryDescription] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Load active timer from localStorage on component mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`active-timer-${task.id}`);
    if (savedTimer) {
      try {
        const timerData: ActiveTimer = JSON.parse(savedTimer);
        // Check if the timer is still valid (less than 24 hours old)
        const timeIn = new Date(timerData.timeIn);
        const hoursSinceStart = differenceInSeconds(new Date(), timeIn) / 3600;

        if (hoursSinceStart < 24) {
          // Prevent very old timers
          setActiveTimer(timerData);
          setCurrentTimerStart(timeIn);
          setCurrentTimeEntryId(timerData.id);
          setIsTimerRunning(true);
          setNewEntryDescription(timerData.description);
        } else {
          // Clean up expired timer
          localStorage.removeItem(`active-timer-${task.id}`);
        }
      } catch (error) {
        console.error("Error loading saved timer:", error);
        localStorage.removeItem(`active-timer-${task.id}`);
      }
    }
  }, [task.id]);

  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.toString === "function"
    ) {
      return parseFloat(value.toString()) || 0;
    }
    return 0;
  };

  // Calculate total time including current session
  const getTotalTimeTracked = () => {
    const baseTime = task.timeEntries.reduce((total, entry) => {
      const hours = toNumber(entry.hours);
      return total + hours;
    }, 0);

    if (isTimerRunning && currentTimerStart) {
      const currentSessionHours =
        differenceInSeconds(new Date(), currentTimerStart) / 3600;
      return baseTime + currentSessionHours;
    }

    return baseTime;
  };

  const totalTimeTracked = getTotalTimeTracked();
  const timeEstimate = toNumber(task.estimatedHours);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning && currentTimerStart) {
      interval = setInterval(() => {
        const diffInSeconds = differenceInSeconds(
          new Date(),
          currentTimerStart
        );
        setElapsedTime(diffInSeconds / 3600);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, currentTimerStart]);

  const handleStartTimer = () => {
    if (!newEntryDescription.trim()) {
      setShowStartDialog(true);
    } else {
      startTimer();
    }
  };

  const startTimer = async () => {
    const startTime = new Date();

    try {
      // Create time entry immediately when starting timer
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.project.id,
          timeIn: startTime.toISOString(),
          timeOut: null, // Set to null initially for active timer
          hours: 0, // Will be calculated when stopping
          description: newEntryDescription || `Working on ${task.title}`,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const newTimeEntry = await response.json();

        // Save timer to localStorage for persistence
        const timerData: ActiveTimer = {
          id: newTimeEntry.id,
          taskId: task.id,
          timeIn: startTime,
          description: newEntryDescription,
        };
        localStorage.setItem(
          `active-timer-${task.id}`,
          JSON.stringify(timerData)
        );

        setCurrentTimeEntryId(newTimeEntry.id);
        setCurrentTimerStart(startTime);
        setIsTimerRunning(true);
        setElapsedTime(0);
        setShowStartDialog(false);
      }
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const stopTimer = async () => {
    if (!currentTimerStart || !currentTimeEntryId) return;

    const endTime = new Date();
    const hoursWorked = differenceInSeconds(endTime, currentTimerStart) / 3600;

    try {
      // Update the existing time entry with timeOut and calculated hours
      const response = await fetch(`/api/time-entries/${currentTimeEntryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeOut: endTime.toISOString(),
          hours: parseFloat(hoursWorked.toFixed(4)),
        }),
      });

      if (response.ok) {
        // Clean up localStorage
        localStorage.removeItem(`active-timer-${task.id}`);

        // Reset timer state
        setIsTimerRunning(false);
        setCurrentTimerStart(null);
        setCurrentTimeEntryId(null);
        setElapsedTime(0);
        setNewEntryDescription("");
        setActiveTimer(null);

        // Refresh the task data to show the updated time entry
        refetch();
      }
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  const cancelTimer = () => {
    if (currentTimeEntryId) {
      // Delete the time entry if user cancels without saving
      fetch(`/api/time-entries/${currentTimeEntryId}`, {
        method: "DELETE",
      }).catch(console.error);
    }

    localStorage.removeItem(`active-timer-${task.id}`);
    setIsTimerRunning(false);
    setCurrentTimerStart(null);
    setCurrentTimeEntryId(null);
    setElapsedTime(0);
    setActiveTimer(null);
  };

  const addManualEntry = async () => {
    if (!manualTime) return;

    try {
      const hours = parseFloat(manualTime);
      if (isNaN(hours) || hours <= 0) return;

      const now = new Date();
      const timeIn = new Date(now.getTime() - hours * 60 * 60 * 1000);

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.project.id,
          timeIn: timeIn.toISOString(),
          timeOut: now.toISOString(),
          hours: hours,
          description: newEntryDescription || `Manual entry for ${task.title}`,
          date: now.toISOString(),
        }),
      });

      if (response.ok) {
        setManualTime("");
        setNewEntryDescription("");
        setShowManualEntry(false);
        refetch();
      }
    } catch (error) {
      console.error("Failed to add manual time entry:", error);
    }
  };

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  const formatDuration = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
    const hoursPart = Math.floor(totalSeconds / 3600);
    const minutesPart = Math.floor((totalSeconds % 3600) / 60);
    const secondsPart = totalSeconds % 60;

    if (hoursPart === 0 && minutesPart === 0) {
      return `${secondsPart}s`;
    }
    if (hoursPart === 0) {
      return `${minutesPart}m ${secondsPart}s`;
    }
    return `${hoursPart}h ${minutesPart}m ${secondsPart}s`;
  };

  const formatTimeRange = (timeIn: Date, timeOut: Date | null) => {
    const start = format(new Date(timeIn), "HH:mm");
    const end = timeOut ? format(new Date(timeOut), "HH:mm") : "Active";
    return `${start} - ${end}`;
  };

  const getProgressValue = () => {
    if (timeEstimate <= 0) return 0;
    return Math.min((totalTimeTracked / timeEstimate) * 100, 100);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-lg font-semibold">Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track time spent on this task
              </p>
            </div>

            {/* Time Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalTimeTracked.toFixed(1)}h
                </div>
                <div className="text-xs text-muted-foreground">Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {timeEstimate}h
                </div>
                <div className="text-xs text-muted-foreground">Estimated</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    timeEstimate - totalTimeTracked > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.max(timeEstimate - totalTimeTracked, 0).toFixed(1)}h
                </div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>

            {/* Progress Bar */}
            {timeEstimate > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {Math.round(getProgressValue())}%
                  </span>
                </div>
                <Progress value={getProgressValue()} className="h-2" />
              </div>
            )}

            {/* Timer Section */}
            <div className="space-y-4">
              {isTimerRunning ? (
                <div className="space-y-3 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-green-600 animate-pulse" />
                      <span className="font-medium text-green-800">
                        Timer Running
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-green-800">
                      {formatDuration(elapsedTime)}
                    </div>
                  </div>

                  <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                    <strong>Description:</strong> {newEntryDescription}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={stopTimer}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Timer
                    </Button>
                    <Button
                      onClick={cancelTimer}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={handleStartTimer} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Start Timer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualEntry(!showManualEntry)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Manual Entry */}
              {showManualEntry && !isTimerRunning && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Label>Add Manual Entry</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="Hours"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                    />
                    <Button
                      onClick={addManualEntry}
                      disabled={!manualTime}
                      className="w-full"
                    >
                      Add Time
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newEntryDescription}
                    onChange={(e) => setNewEntryDescription(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Time Entries */}
            {task.timeEntries.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Time Entries</h4>
                  <span className="text-sm text-muted-foreground">
                    {task.timeEntries.length} entries
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {task.timeEntries.map((entry: TimeEntry) => {
                    const entryHours = toNumber(entry.hours);
                    const isActive = entry.timeOut === null;

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          isActive ? "bg-green-50 border-green-200" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className={`text-sm font-medium ${
                                isActive ? "text-green-700" : ""
                              }`}
                            >
                              {formatDuration(entryHours)}
                              {isActive && " ⚡"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimeRange(entry.timeIn, entry.timeOut)}
                            </div>
                          </div>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(entry.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTimeEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Start Timer Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Start Timer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What are you working on?
            </p>

            <Textarea
              placeholder="Describe the work you'll be doing..."
              value={newEntryDescription}
              onChange={(e) => setNewEntryDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Cancel
            </Button>
            <Button onClick={startTimer} disabled={!newEntryDescription.trim()}>
              <Play className="mr-2 h-4 w-4" />
              Start Timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
