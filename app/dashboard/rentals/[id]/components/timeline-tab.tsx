import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { TimelineEvent } from "../types";

interface TimelineTabProps {
  timeline: TimelineEvent[];
}

export default function TimelineTab({ timeline }: TimelineTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Timeline</CardTitle>
        <CardDescription>
          Key events and milestones for this rental
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === "completed"
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  {event.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{event.event}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString()} at{" "}
                  {new Date(event.date).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
