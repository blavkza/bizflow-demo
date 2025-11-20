"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createUserSchema,
  createUserSchemaType,
  updateUserSchema,
} from "@/lib/formValidationSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { UserRole, UserStatus, UserPermission, UserType } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_GROUPS } from "@/types/user";
import { EmployeeForUserLinking } from "@/types/employee";

interface UserFormProps {
  type: "create" | "update";
  data?: {
    id?: string;
    name?: string;
    email?: string;
    role?: UserRole;
    userName?: string;
    phone?: string | null;
    status: UserStatus;
    userType?: UserType;
    employeeId?: string;
    permissions?: UserPermission[];
  };
  onCancel?: () => void;
  onSubmitSuccess?: () => void;
}

const formatPermissionName = (permission: UserPermission) => {
  return permission
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function UserForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: UserFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<
    EmployeeForUserLinking[]
  >([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const formSchema = type === "update" ? updateUserSchema : createUserSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      type === "update"
        ? {
            name: data?.name ?? "",
            phone: data?.phone ?? "",
            email: data?.email ?? "",
            role: data?.role ?? UserRole.VIEWER,
            status: data?.status ?? UserStatus.ACTIVE,
            userType: data?.userType ?? UserType.ADMIN,
            employeeId: data?.employeeId ?? "",
            permissions: data?.permissions ?? [],
          }
        : {
            name: "",
            userName: "",
            phone: "",
            email: "",
            role: UserRole.VIEWER,
            status: UserStatus.ACTIVE,
            userType: UserType.ADMIN,
            employeeId: "",
            password: "",
            confirmPassword: "",
            permissions: [],
          },
  });

  const { isSubmitting } = form.formState;
  const selectedUserType = form.watch("userType");
  const selectedEmployeeId = form.watch("employeeId");

  // Fetch available employees
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const response = await axios.get("/api/employees/available");
        setAvailableEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load available employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchAvailableEmployees();
  }, []);

  // Get selected employee details
  const selectedEmployee = availableEmployees.find(
    (emp) => emp.id === selectedEmployeeId
  );

  const onSubmit = async (values: FormValues) => {
    try {
      if (type === "create") {
        await axios.post("/api/users", values);
        toast.success("User created successfully");
      } else if (type === "update" && data?.id) {
        const updateData = { ...values };
        await axios.put(`/api/users/${data.id}`, updateData);
        toast.success("User updated successfully");
      }

      form.reset();
      router.refresh();
      onSubmitSuccess?.();
      onCancel?.();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const toggleAllPermissions = (
    categoryPermissions: UserPermission[],
    value: boolean
  ) => {
    const currentPermissions = [...form.getValues("permissions")];
    let updatedPermissions: UserPermission[];

    if (value) {
      updatedPermissions = [
        ...new Set([...currentPermissions, ...categoryPermissions]),
      ];
    } else {
      updatedPermissions = currentPermissions.filter(
        (permission) => !categoryPermissions.includes(permission)
      );
    }

    form.setValue("permissions", updatedPermissions);
  };

  const areAllPermissionsEnabled = (categoryPermissions: UserPermission[]) => {
    const currentPermissions = form.watch("permissions");
    return categoryPermissions.every((permission) =>
      currentPermissions.includes(permission)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Type Field */}
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employee Selection (show for both ADMIN and EMPLOYEE, but required for EMPLOYEE) */}
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Link to Employee{" "}
                  {selectedUserType === UserType.EMPLOYEE && "*"}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                  disabled={isLoadingEmployees}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingEmployees
                            ? "Loading employees..."
                            : "Select an employee (optional)"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-employee">
                      No employee linked
                    </SelectItem>
                    {availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} (
                        {employee.employeeNumber})
                        {employee.email && ` - ${employee.email}`}
                      </SelectItem>
                    ))}
                    {availableEmployees.length === 0 && !isLoadingEmployees && (
                      <SelectItem value="no-available-employees" disabled>
                        No available employees found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  {selectedUserType === UserType.EMPLOYEE
                    ? "Employee users must be linked to an employee record"
                    : "Optionally link this admin user to an employee record"}
                </p>
              </FormItem>
            )}
          />

          {/* Show selected employee info */}
          {selectedEmployee && (
            <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">Selected Employee:</h4>
              <p className="text-sm text-blue-800">
                <strong>Name:</strong> {selectedEmployee.firstName}{" "}
                {selectedEmployee.lastName}
                <br />
                <strong>Employee #:</strong> {selectedEmployee.employeeNumber}
                <br />
                <strong>Position:</strong> {selectedEmployee.position}
                <br />
                {selectedEmployee.department && (
                  <>
                    <strong>Department:</strong>{" "}
                    {selectedEmployee.department.name}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Rest of your form fields remain the same */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "create" && (
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "create" && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Permissions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allPermissions = Object.values(UserPermission);
                  form.setValue("permissions", allPermissions);
                }}
              >
                Enable All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("permissions", []);
                }}
              >
                Disable All
              </Button>
            </div>
          </div>

          {/* Info messages */}
          {selectedUserType === UserType.EMPLOYEE && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Employee User:</strong> This user is linked to an
                employee record but can still have system permissions.
              </p>
            </div>
          )}

          {selectedUserType === UserType.ADMIN && selectedEmployee && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Admin with Employee Link:</strong> This admin user is
                also linked to an employee record.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.name} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{group.name}</h4>
                  <Switch
                    checked={areAllPermissionsEnabled(group.permissions)}
                    onCheckedChange={(checked) =>
                      toggleAllPermissions(group.permissions, checked)
                    }
                  />
                </div>

                <div className="space-y-3">
                  {group.permissions.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name="permissions"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        permission,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== permission
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer">
                              {formatPermissionName(permission)}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : type === "create" ? (
              "Create User"
            ) : (
              "Update User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
