"use client";

import { useState } from "react";
import { Mail, Paperclip, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SendEmailDialogProps {
  recipientName: string;
  recipientEmail: string;
  trigger?: React.ReactNode;
}

export function SendEmailDialog({
  recipientName,
  recipientEmail,
  trigger,
}: SendEmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("to", recipientEmail);
      formData.append("subject", subject);
      formData.append("message", message);
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/send-custom-email", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      toast.success(`Email sent successfully to ${recipientName}`);
      setIsOpen(false);
      // Reset form
      setSubject("");
      setMessage("");
      setAttachments([]);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] gap-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Send Email</DialogTitle>
          </div>
          <DialogDescription>
            Composer an email to <strong>{recipientName}</strong> (
            {recipientEmail}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="to-email" className="text-sm font-medium">
              Recipient
            </Label>
            <Input
              id="to-email"
              value={`${recipientName} <${recipientEmail}>`}
              disabled
              className="bg-muted/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] resize-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-xs border border-border group"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px] font-medium">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No attachments added
                </p>
              )}
            </div>
            <div className="mt-2">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-dashed hover:border-blue-500 hover:text-blue-500"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip className="h-3.5 w-3.5 mr-2" />
                Attach files
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
