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
import { Badge } from "@/components/ui/badge";
import { Building, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DepartmentFilterProps {
  form: UseFormReturn<any>;
  departments: { id: string; name: string }[];
  isLoading?: boolean;
}

export function DepartmentFilter({
  form,
  departments,
  isLoading = false,
}: DepartmentFilterProps) {
  const selectedDepartments = form.watch("departments") || [];

  const handleRemoveDepartment = (departmentId: string) => {
    const current = selectedDepartments;
    form.setValue(
      "departments",
      current.filter((id: string) => id !== departmentId)
    );
  };

  const handleClearAll = () => {
    form.setValue("departments", []);
  };

  const getSelectedDepartmentNames = () => {
    return selectedDepartments.map((deptId) => {
      const dept = departments.find((d) => d.id === deptId);
      return dept?.name || deptId;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Department Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Loading departments...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Department Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="departments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Departments</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (!selectedDepartments.includes(value)) {
                    form.setValue("departments", [
                      ...selectedDepartments,
                      value,
                    ]);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <SelectValue placeholder="Select departments to filter by" />
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={department.id}
                      disabled={selectedDepartments.includes(department.id)}
                    >
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />

              {/* Selected departments display */}
              {selectedDepartments.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Selected Departments ({selectedDepartments.length})
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {getSelectedDepartmentNames().map((deptName, index) => (
                      <Badge
                        key={selectedDepartments[index]}
                        variant="secondary"
                        className="flex items-center gap-1 py-1.5"
                      >
                        {deptName}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() =>
                            handleRemoveDepartment(selectedDepartments[index])
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {selectedDepartments.length === 0
                  ? "All departments will be included"
                  : "Only employees from selected departments will be shown"}
              </p>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
