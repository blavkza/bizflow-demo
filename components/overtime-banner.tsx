"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export function OvertimeBanner() {
  const { userId } = useAuth();
  const [pendingAvailability, setPendingAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchPendingAvailability = async () => {
      try {
        const res = await fetch(`/api/overtime/pending?userId=${userId}`);
        const data = await res.json();
        if (data.availability) {
          setPendingAvailability(data.availability);
        }
      } catch (error) {
        console.error("Error fetching pending overtime availability:", error);
      }
    };

    fetchPendingAvailability();
  }, [userId]);

  const handleResponse = async (status: "AVAILABLE" | "UNAVAILABLE") => {
    if (!pendingAvailability) return;
    setLoading(true);

    try {
      const res = await fetch("/api/overtime/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityId: pendingAvailability.id,
          status,
        }),
      });

      if (res.ok) {
        toast.success(
          `Overtime ${status === "AVAILABLE" ? "accepted" : "rejected"} successfully`,
        );
        setPendingAvailability(null);
      } else {
        const error = await res.json();
        toast.error(
          error.error || "Failed to respond to overtime availability",
        );
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!pendingAvailability) return null;

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 p-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">
              Overtime Availability Check
            </h3>
            <p className="text-sm text-muted-foreground">
              Are you available for overtime today?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="default"
            className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => handleResponse("AVAILABLE")}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4" />
            Accept
          </Button>
          <Button
            variant="destructive"
            className="flex-1 md:flex-none gap-2"
            onClick={() => handleResponse("UNAVAILABLE")}
            disabled={loading}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
