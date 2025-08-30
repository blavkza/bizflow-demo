import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { Task } from "@/types/tasks";

interface TimeTrackingTabProps {
  task: Task;
}

export default function TimeTrackingTab({ task }: TimeTrackingTabProps) {
  const totalTimeTracked = task.timeEntries.reduce(
    (total, entry) => total + entry.hours,
    0
  );
  const timeEstimate = task.estimatedHours || 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Time Tracked
              </Label>
              <p className="text-2xl font-bold">{totalTimeTracked}h</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Estimated
              </Label>
              <p className="text-2xl font-bold">{timeEstimate}h</p>
            </div>
          </div>
          {timeEstimate > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {Math.round((totalTimeTracked / timeEstimate) * 100)}%
                </span>
              </div>
              <Progress
                value={Math.min((totalTimeTracked / timeEstimate) * 100, 100)}
                className="h-2"
              />
            </div>
          )}
          <Button size="sm" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
          {task.timeEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Time Entries</h4>
              {task.timeEntries.map((entry) => (
                <div key={entry.id} className="flex justify-between text-sm">
                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                  <span className="font-medium">{entry.hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
