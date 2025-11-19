import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserCheck, Briefcase } from "lucide-react";

interface WorkerTypeFilterProps {
  form: UseFormReturn<any>;
}

export function WorkerTypeFilter({ form }: WorkerTypeFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Worker Type Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="workerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Include Workers</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Workers (Employees + Freelancers)
                    </div>
                  </SelectItem>
                  <SelectItem value="employees">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Employees Only
                    </div>
                  </SelectItem>
                  <SelectItem value="freelancers">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Freelancers Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
