import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Expense, Attachment, Payment } from "../types";

interface AuditLogProps {
  expense: Expense;
}

interface Activity {
  id: string;
  type: "expense_created" | "payment_added" | "attachment_added";
  title: string;
  description: string;
  date: string;
  details?: string;
}

export default function AuditLog({ expense }: AuditLogProps) {
  const attachments: Attachment[] = expense.attachments || [];

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "expense_created":
        return <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>;
      case "payment_added":
        return <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>;
      case "attachment_added":
        return <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>;
    }
  };

  // Create activities with proper typing
  const activities: Activity[] = [
    {
      id: "1",
      type: "expense_created",
      title: "Expense Created",
      description: `Expense ${expense.expenseNumber} was created`,
      date: expense.createdAt,
    },
    ...attachments.map(
      (attachment): Activity => ({
        id: `attachment_${attachment.id}`,
        type: "attachment_added",
        title: "Attachment Added",
        description: `${attachment.filename} was uploaded`,
        date: attachment.uploadedAt,
      })
    ),
    ...expense.payments.map(
      (payment): Activity => ({
        id: `payment_${payment.id}`,
        type: "payment_added",
        title: "Payment Recorded",
        description: `Payment of R${payment.amount.toLocaleString()} recorded`,
        date: payment.paymentDate,
        details: `by ${payment.paidBy}`,
      })
    ),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Recent activity for this expense ({activities.length} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              {getActivityIcon(activity.type)}
              <div className="flex-1 space-y-1 pb-6 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{activity.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                {activity.details && (
                  <p className="text-xs text-muted-foreground">
                    {activity.details}
                  </p>
                )}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No activity recorded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
