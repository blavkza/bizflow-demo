"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  condition: z.string().min(1),
  isPresent: z.boolean().default(true),
  isLost: z.boolean().default(false),
  damageDescription: z.string().optional(),
  cost: z.coerce.number().optional().default(0),
  deductFromWorker: z.boolean().default(false),
  pushToMaintenance: z.boolean().default(false),
  notes: z.string().optional(),
});

interface CheckToolDialogProps {
  tool: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckToolDialog({
  tool,
  isOpen,
  onClose,
  onSuccess,
}: CheckToolDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condition: tool?.condition || "GOOD",
      isPresent: true,
      isLost: false,
      damageDescription: "",
      cost: 0,
      deductFromWorker: false,
      pushToMaintenance: false,
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await axios.post("/api/worker-tools/check", {
        toolId: tool.id,
        ...values,
      });
      toast.success("Tool check recorded successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const watchCondition = form.watch("condition");
  const watchIsLost = form.watch("isLost");
  const watchIsPresent = form.watch("isPresent");

  // Sync isLost and isPresent
  const handleStatusChange = (val: string) => {
    const isLost = val === "lost";
    form.setValue("isLost", isLost);
    form.setValue("isPresent", !isLost);

    if (isLost) {
      form.setValue("cost", Number(tool?.purchasePrice || 0));
      form.setValue("condition", "LOST");
      form.setValue("deductFromWorker", true);
    } else {
      if (watchCondition !== "DAMAGED") {
        form.setValue("cost", 0);
      }
    }
  };

  const showCostInput = watchCondition === "DAMAGED" || watchIsLost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perform Tool Check</DialogTitle>
          <DialogDescription>
            Verify the status and condition of {tool?.name}.
          </DialogDescription>
        </DialogHeader>

        {/* Tool Info Card */}
        <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tool Price:</span>
            <span className="text-sm font-bold text-blue-600">
              {new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format(Number(tool?.purchasePrice || 0))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Allocated Date:</span>
            <span className="text-sm">
              {tool?.allocatedDate
                ? format(new Date(tool.allocatedDate), "PPP")
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tool Availability Status</Label>
            <Tabs
              value={watchIsLost ? "lost" : "present"}
              onValueChange={handleStatusChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="present" className="text-sm font-medium">
                  Tool is Present
                </TabsTrigger>
                <TabsTrigger
                  value="lost"
                  className="text-sm font-medium data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                >
                  Tool is Lost
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {watchIsPresent && (
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool Condition</FormLabel>
                      <Select
                        disabled={loading}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GOOD">
                            Good (Minor wear)
                          </SelectItem>
                          <SelectItem value="FAIR">
                            Fair (Functioning)
                          </SelectItem>
                          <SelectItem value="POOR">
                            Poor (Requires attn)
                          </SelectItem>
                          <SelectItem value="DAMAGED">
                            Damaged (Broken)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showCostInput && (
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchIsLost
                            ? "Replacement Value (R)"
                            : "Repair Estimate (R)"}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">
                              R
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        {watchIsLost && (
                          <p className="text-[10px] text-muted-foreground italic mt-1">
                            Pre-filled with purchase price. Edit if necessary.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 border-t">
                    <FormField
                      control={form.control}
                      name="deductFromWorker"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              Deduct from worker?
                            </FormLabel>
                            <FormDescription className="text-[10px]">
                              Apply this cost to the worker's record
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {!watchIsLost && (
                    <div className="pt-2 border-t">
                      <FormField
                        control={form.control}
                        name="pushToMaintenance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">
                                Push to Maintenance?
                              </FormLabel>
                              <FormDescription className="text-[10px]">
                                Mark as Maintenance and Return from worker
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              {(watchIsLost || watchCondition === "DAMAGED") && (
                <FormField
                  control={form.control}
                  name="damageDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchIsLost ? "Loss Details" : "Damage Details"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            watchIsLost
                              ? "Describe the circumstances of loss..."
                              : "Describe what specifically is damaged..."
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional observations or weights..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant={watchIsLost ? "destructive" : "default"}
                >
                  {loading ? "Recording..." : "Finish Inspection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
