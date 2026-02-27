import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  overtimeAvailabilityCron,
  processOvertimeAvailability,
  shiftOverReminderCron,
  processShiftOverReminder,
  autoShiftCheckoutCron,
  processAutoShiftCheckout,
  breakReminderCron,
  processBreakReminder,
} from "@/lib/inngest/functions";

console.log("Inngest API Route: Initializing serve...");

export const { GET, POST, PUT } = serve({
  client: inngest,
  id: "biz-flow-management-system",
  functions: [
    overtimeAvailabilityCron,
    processOvertimeAvailability,
    shiftOverReminderCron,
    processShiftOverReminder,
    autoShiftCheckoutCron,
    processAutoShiftCheckout,
    breakReminderCron,
    processBreakReminder,
  ],
});
