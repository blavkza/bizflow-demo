"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Play, Square, Timer, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BreakStatus {
  checkedIn: boolean;
  onBreak: boolean;
  activeBreak?: {
    startTime: string;
  };
  totalBreakDuration: number;
  remainingTotalMinutes: number;
  maxBreaks: number;
  breakReminderMinutes: number;
  break1WindowStart: string;
  break1WindowEnd: string;
  break2WindowStart: string;
  break2WindowEnd: string;
  break3WindowStart: string;
  break3WindowEnd: string;
  break4WindowStart: string;
  break4WindowEnd: string;
  breaks: any[];
}

export function BreakControl({ 
  employeeId, 
  freelancerId 
}: { 
  employeeId?: string | null; 
  freelancerId?: string | null;
}) {
  const [status, setStatus] = useState<BreakStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [warningShown, setWarningShown] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!employeeId && !freelancerId) return;
    try {
      setIsLoading(true);
      const idParam = employeeId ? `employeeId=${employeeId}` : `freelancerId=${freelancerId}`;
      const response = await axios.get(`/api/attendance/break?${idParam}`);
      setStatus(response.data);
      
      if (response.data.onBreak && response.data.activeBreak) {
        const start = new Date(response.data.activeBreak.startTime);
        setElapsedMinutes(Math.floor((new Date().getTime() - start.getTime()) / 60000));
      }
    } catch (error) {
      console.error("Failed to fetch break status", error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, freelancerId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Timer for active break
  useEffect(() => {
    if (status?.onBreak && status.activeBreak) {
      const timer = setInterval(() => {
        const start = new Date(status.activeBreak!.startTime);
        const currentElapsed = Math.floor((new Date().getTime() - start.getTime()) / 60000);
        setElapsedMinutes(currentElapsed);

        // Check for 5-minute warning
        const remainingTotal = status.remainingTotalMinutes - currentElapsed;
        if (remainingTotal <= (status.breakReminderMinutes || 5) && remainingTotal > 0 && !warningShown) {
          playWarning();
          setWarningShown(true);
        }
      }, 10000); // Check every 10 seconds
      return () => clearInterval(timer);
    } else {
      setWarningShown(false);
      setElapsedMinutes(0);
    }
  }, [status, warningShown]);

  const playWarning = () => {
    toast.warning(`Break Time Ending Soon!`, {
      description: `You have less than ${status?.breakReminderMinutes || 5} minutes of break time remaining.`,
      duration: 10000,
    });
    
    // Play a browser beep if possible
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio warning failed", e);
    }
  };

  const handleAction = async (action: "start" | "end") => {
    try {
      setIsActionLoading(true);
      const response = await axios.post("/api/attendance/break", {
        employeeId,
        freelancerId,
        action,
      });
      toast.success(response.data.message);
      await fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const isOutsideWindow = () => {
    if (!status) return false;
    const completedBreaks = status.breaks?.filter((b: any) => b.endTime).length || 0;
    let windowStart = status.break1WindowStart;
    let windowEnd = status.break1WindowEnd;

    if (completedBreaks === 1) {
      windowStart = status.break2WindowStart;
      windowEnd = status.break2WindowEnd;
    } else if (completedBreaks === 2) {
      windowStart = status.break3WindowStart;
      windowEnd = status.break3WindowEnd;
    } else if (completedBreaks >= 3) {
      windowStart = status.break4WindowStart;
      windowEnd = status.break4WindowEnd;
    }
    
    if (!windowStart || !windowEnd) return false;
    const now = new Date();
    const current = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    return current < windowStart || current > windowEnd;
  };

  if (!status?.checkedIn) return null;

  const totalUsed = status.totalBreakDuration + (status.onBreak ? elapsedMinutes : 0);
  const totalAllowed = status.totalBreakDuration + status.remainingTotalMinutes;
  const progressPercent = Math.min(100, (totalUsed / totalAllowed) * 100);
  const remaining = Math.max(0, status.remainingTotalMinutes - (status.onBreak ? elapsedMinutes : 0));
  const outsideWindow = isOutsideWindow();

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            <span>Break Management</span>
          </div>
          {status.onBreak && (
            <span className="flex items-center gap-1 text-xs text-orange-500 animate-pulse">
              <Timer className="h-3 w-3" />
              On Break
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {totalUsed} min</span>
              <span>Total: {totalAllowed} min</span>
            </div>
            <Progress value={progressPercent} className={cn(
              "h-2",
              progressPercent > 90 ? "bg-red-100" : progressPercent > 70 ? "bg-orange-100" : "bg-primary/10"
            )}>
              <div 
                className={cn(
                  "h-full transition-all", 
                  progressPercent > 90 ? "bg-destructive" : progressPercent > 70 ? "bg-orange-500" : "bg-primary"
                )} 
                style={{ width: `${progressPercent}%` }} 
              />
            </Progress>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">
                {remaining} <span className="text-sm font-normal text-muted-foreground">min left</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Remaining break time</span>
            </div>

            {status.onBreak ? (
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                onClick={() => handleAction("end")}
                disabled={isActionLoading}
              >
                <Square className="h-4 w-4 fill-current" />
                End Break
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleAction("start")}
                disabled={isActionLoading || status.breaks.length >= status.maxBreaks || remaining <= 0 || outsideWindow}
              >
                <Play className="h-4 w-4 fill-current" />
                Start Break
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
              <Clock className="h-3 w-3" />
              <span>
                Allowed Window: {(() => {
                  const bc = status.breaks?.filter((b: any) => b.endTime).length || 0;
                  if (bc === 0) return `${status.break1WindowStart} - ${status.break1WindowEnd}`;
                  if (bc === 1) return `${status.break2WindowStart} - ${status.break2WindowEnd}`;
                  if (bc === 2) return `${status.break3WindowStart} - ${status.break3WindowEnd}`;
                  return `${status.break4WindowStart} - ${status.break4WindowEnd}`;
                })()}
              </span>
            </div>

            {outsideWindow && !status.onBreak && (
              <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                <AlertCircle className="h-3 w-3" />
                <span>Outside allowed break hours</span>
              </div>
            )}

            {status.breaks.length >= status.maxBreaks && !status.onBreak && (
              <div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                <AlertCircle className="h-3 w-3" />
                <span>Maximum breaks reached for today</span>
              </div>
            )}
            
            {remaining <= 0 && !status.onBreak && (
              <div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                <AlertCircle className="h-3 w-3" />
                <span>Total break duration exceeded</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
