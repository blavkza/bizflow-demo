import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Clock, Users } from "lucide-react";

interface HRSettingsCardProps {
  hrSettings: any;
}

export function HRSettingsCard({ hrSettings }: HRSettingsCardProps) {
  if (!hrSettings) return null;

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Payday</p>
              <p className="text-muted-foreground">
                Day {hrSettings.paymentDay} of{" "}
                {hrSettings.paymentMonth.toLowerCase()} month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Overtime Rate</p>
              <p className="text-muted-foreground">
                R{hrSettings.overtimeHourRate} per hour
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Working Hours</p>
              <p className="text-muted-foreground">
                {hrSettings.workingHoursPerDay}h per day
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
