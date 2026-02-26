"use client";
import { useState } from "react";
import { Mail, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendEmailDialog } from "@/components/SendEmailDialog";

interface TraineeWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export function QuickActionsCard({ trainee }: { trainee: TraineeWithDetails }) {
  const fullName = `${trainee.firstName} ${trainee.lastName}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Send Email */}
        <SendEmailDialog
          recipientName={fullName}
          recipientEmail={trainee.email || ""}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          }
        />

        {/* Schedule Meeting */}
        <Button variant="outline" className="w-full justify-start">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>

        {/* Send Message */}
        <Button variant="outline" className="w-full justify-start">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
}
