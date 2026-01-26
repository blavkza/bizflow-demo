import React from "react";

interface WorkSummaryProps {
  daysWorked: number;
  regularHours: number;
  overtimeHours: number;
}

const WorkSummary: React.FC<WorkSummaryProps> = ({
  daysWorked,
  regularHours,
  overtimeHours,
}) => {
  return (
    <div className="mt-8 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-bold text-lg mb-4">Work Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm text-muted-foreground">Days Worked</p>
          <p className="text-xl font-bold text-blue-700">{daysWorked}</p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm text-muted-foreground">Regular Hours</p>
          <p className="text-xl font-bold text-green-700">
            {regularHours?.toFixed(1) || "0.0"}
          </p>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm text-muted-foreground">Overtime Hours</p>
          <p className="text-xl font-bold text-orange-700">
            {overtimeHours?.toFixed(1) || "0.0"}
          </p>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-zinc-900 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="text-xl font-bold text-purple-700">
            {(regularHours + overtimeHours).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkSummary;
