import { format } from "date-fns";

interface EventItemProps {
  title: string;
  date: string;
  type: string;
}

export function EventItem({ title, date, type }: EventItemProps) {
  let color = "bg-blue-500";
  if (type === "tax") color = "bg-orange-500";
  if (type === "review") color = "bg-green-500";

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 ${color} rounded-full`}></div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(date), "MMM d, yyyy")}
        </div>
      </div>
    </div>
  );
}
