"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Siren, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PendingCallOut {
  id: string;
  type: string;
  requestedAt: string;
  destination: string;
  requestedUser: {
    name: string;
  };
}

export default function CallOutsAlert() {
  const [pendingCount, setPendingCount] = useState(0);
  const [latestCallOuts, setLatestCallOuts] = useState<PendingCallOut[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const response = await fetch("/api/emergency-callouts?status=PENDING");
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.length);
        setLatestCallOuts(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch pending callouts", error);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
            <Siren className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-red-800 dark:text-red-400">
              Pending Emergency Call-Outs
            </CardTitle>
            <p className="text-xs text-red-600/80">
              {pendingCount} request{pendingCount !== 1 ? "s" : ""} require
              {pendingCount === 1 ? "s" : ""} your attention
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-700 hover:bg-red-100"
          onClick={() => router.push("/dashboard/emergency-callouts")}
        >
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-2">
          {latestCallOuts.map((callOut) => (
            <div
              key={callOut.id}
              className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/40 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() =>
                router.push(`/dashboard/emergency-callouts/${callOut.id}`)
              }
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {callOut.requestedUser.name} -{" "}
                  <Badge variant="outline" className="text-[10px] h-4 py-0">
                    {callOut.type}
                  </Badge>
                </span>
                <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                  {callOut.destination}
                </span>
              </div>
              <div className="flex items-center text-[10px] text-gray-400 gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(callOut.requestedAt))} ago
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
