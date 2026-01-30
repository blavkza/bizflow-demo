"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, Info } from "lucide-react";

export function OvertimeChecker() {
  const { data, isLoading } = useDashboardData();
  const [showPopover, setShowPopover] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const employee = data?.currentUser?.employee;
  const attendance = employee?.AttendanceRecord?.[0];

  const todayRecord = useMemo(() => {
    if (!attendance) return null;
    const now = new Date();
    const recordDate = new Date(attendance.date);
    
    // Check if it's the same calendar day
    return (
      now.getFullYear() === recordDate.getFullYear() &&
      now.getMonth() === recordDate.getMonth() &&
      now.getDate() === recordDate.getDate()
    ) ? attendance : null;
  }, [attendance]);

  useEffect(() => {
    if (isLoading || !employee || !todayRecord) return;

    // Check if knocked in but not knocked out
    const isKnockedIn = todayRecord.checkIn && !todayRecord.checkOut;
    if (!isKnockedIn) return;

    const checkOvertime = () => {
      const now = new Date();
      const scheduledKO = employee.scheduledKnockOut || "17:00";
      const [koHours, koMinutes] = scheduledKO.split(":").map(Number);
      
      const koToday = new Date();
      koToday.setHours(koHours, koMinutes, 0, 0);

      const todayStr = now.toDateString();
      const hasNotifiedId = `ot-notified-${todayStr}`;
      const hasPopoverShownId = `ot-popover-${todayStr}`;
      const hasAcceptedId = `ot-accepted-${todayStr}`;

      // 1. Initial notification at KO time
      if (now >= koToday && !localStorage.getItem(hasNotifiedId)) {
        toast.info(`Your shift ended at ${scheduledKO}. Don't forget to knock out!`, {
          duration: 8000,
        });
        localStorage.setItem(hasNotifiedId, "true");
        playRing();
        
        // Create DB notification
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Shift Ended",
            message: `Your shift ended at ${scheduledKO}. Please remember to knock out.`,
            type: "ATTENDANCE",
            priority: "MEDIUM"
          })
        }).catch(err => console.error("Failed to create shift end notification:", err));
      }

      // 2. Overtime popover 30 minutes after KO time
      const popoverTriggerTime = new Date(koToday.getTime() + 30 * 60000);
      if (
        now >= popoverTriggerTime && 
        !localStorage.getItem(hasPopoverShownId) && 
        !localStorage.getItem(hasAcceptedId)
      ) {
        setShowPopover(true);
        localStorage.setItem(hasPopoverShownId, "true");
        playRing();

        // Create DB notification
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Overtime Available",
            message: `You are still knocked in 30 minutes after your shift end. Please accept or dismiss overtime.`,
            type: "ATTENDANCE",
            priority: "HIGH"
          })
        }).catch(err => console.error("Failed to create overtime offer notification:", err));
      }
    };

    const interval = setInterval(checkOvertime, 30000); // Check every 30 seconds
    checkOvertime(); // Initial check
    return () => clearInterval(interval);
  }, [employee, todayRecord, isLoading]);

  useEffect(() => {
    if (showPopover) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowPopover(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(600);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showPopover]);

  const playRing = () => {
    try {
      if (!audioRef.current) {
        // Using a standard notification sound
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      }
      audioRef.current.play().catch(err => console.warn("Audio play blocked:", err));
    } catch (e) {
      console.warn("Failed to play notification sound:", e);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch("/api/attendance/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          startTime: new Date().toISOString(),
          reason: "Accepted overtime after 30-minute late stay",
        }),
      });

      if (response.ok) {
        toast.success("Overtime request submitted and awaiting admin approval");
        localStorage.setItem(`ot-accepted-${new Date().toDateString()}`, "true");
        setShowPopover(false);
      } else {
        toast.error("Could not submit overtime request. Please try again or contact admin.");
      }
    } catch (error) {
      console.error("Overtime submission error:", error);
      toast.error("Internal server error during overtime submission");
    }
  };

  if (!showPopover) return null;

  return (
    <AlertDialog open={showPopover} onOpenChange={setShowPopover}>
      <AlertDialogContent className="z-[100] border-2 border-primary shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5 animate-pulse" />
            Overtime Opportunity Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-card-foreground">
            It is now 30 minutes past your scheduled knock-out time ({employee.scheduledKnockOut}). 
            Would you like to register this extra time as overtime?
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-md flex items-start gap-2 border border-slate-200 dark:border-slate-700">
              <Info className="h-4 w-4 mt-0.5 text-primary" />
              <div className="text-sm space-y-1">
                <p>Accepting will notify admin for approval.</p>
                <p className="font-semibold text-red-500">
                  This offer expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            onClick={() => setShowPopover(false)}
            className="border-slate-300"
          >
            No, Dismiss
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAccept}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Accept Overtime
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
