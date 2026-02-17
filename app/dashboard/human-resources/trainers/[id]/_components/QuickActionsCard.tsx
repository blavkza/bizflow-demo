"use client";
import { useState } from "react";
import { Mail, FileText, MessageSquare, Calendar } from "lucide-react";
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

interface TrainerWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export function QuickActionsCard({ trainer }: { trainer: TrainerWithDetails }) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const fullName = `${trainer.firstName} ${trainer.lastName}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Send Email */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Email to {fullName}</DialogTitle>
              <DialogDescription>
                Compose and send an email message
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">To</Label>
                <Input id="email-to" value={trainer.email} disabled />
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

        {/* Send Invoice */}
        <Dialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Invoice for {fullName}</DialogTitle>
              <DialogDescription>
                Generate and send an invoice for services rendered
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-amount">Amount</Label>
                  <Input id="invoice-amount" type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="invoice-due-date">Due Date</Label>
                  <Input id="invoice-due-date" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-description">Description</Label>
                <Input
                  id="invoice-description"
                  placeholder="Services description"
                />
              </div>
              <div>
                <Label htmlFor="invoice-notes">Notes</Label>
                <Textarea
                  id="invoice-notes"
                  placeholder="Additional notes..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInvoiceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsInvoiceDialogOpen(false)}>
                Send Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
