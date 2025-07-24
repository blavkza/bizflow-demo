// QuickActionsCard.tsx
"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeWithDetails } from "@/types/employee";

export function QuickActionsCard({
  employee,
}: {
  employee: EmployeeWithDetails;
}) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Send Email to {employee.firstName} {employee.lastName}
              </DialogTitle>
              <DialogDescription>
                Compose and send an email message
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">To</Label>
                <Input id="email-to" value={employee.email} disabled />
              </div>
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input id="email-subject" placeholder="Enter email subject" />
              </div>
              <div>
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  placeholder="Type your message here..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="urgent" className="rounded" />
                <Label htmlFor="urgent" className="text-sm">
                  Mark as urgent
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsEmailDialogOpen(false)}>
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
