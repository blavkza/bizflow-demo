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
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

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
  const currentName = form.watch("name");
  const currentEmail = form.watch("email");
  const currentPhone = form.watch("phone");
  const currentUserName = form.watch("userName");

  // Fetch available employees
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        // For update, include currently linked employee
        const url =
          type === "update" && data?.employeeId
            ? `/api/employees/available?includeCurrent=true&currentEmployeeId=${data.employeeId}`
            : "/api/employees/available";

        const response = await axios.get(url);
        setAvailableEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load available employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchAvailableEmployees();
  }, [type, data?.employeeId]);

  // Get selected employee details
  const selectedEmployee = availableEmployees.find(
    (emp) => emp.id === selectedEmployeeId
  );

  // Get currently linked employee for update
  const currentLinkedEmployee =
    type === "update" && data?.employeeId
      ? availableEmployees.find((emp) => emp.id === data.employeeId)
      : null;

  // Auto-fill user details from employee when employee is selected
  useEffect(() => {
    if (
      selectedEmployee &&
      selectedEmployeeId !== "no-employee" &&
      !hasAutoFilled
    ) {
      const shouldAutoFill = () => {
        // Only auto-fill if all fields are empty
        const isNameEmpty = !currentName || currentName.trim() === "";
        const isEmailEmpty = !currentEmail || currentEmail.trim() === "";
        const isPhoneEmpty = !currentPhone || currentPhone.trim() === "";
        const isUserNameEmpty =
          type === "create" &&
          (!currentUserName || currentUserName.trim() === "");

        return (
          isNameEmpty &&
          isEmailEmpty &&
          isPhoneEmpty &&
          (type === "update" || isUserNameEmpty)
        );
      };

      if (shouldAutoFill()) {
        const employeeFullName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;

        // Auto-fill only empty fields
        if (!currentName || currentName.trim() === "") {
          form.setValue("name", employeeFullName);
        }

        if (!currentEmail || currentEmail.trim() === "") {
          form.setValue("email", selectedEmployee.email || "");
        }

        if (!currentPhone || currentPhone.trim() === "") {
          form.setValue("phone", selectedEmployee.phone || "");
        }

        // Only auto-fill username for new users
        if (
          type === "create" &&
          (!currentUserName || currentUserName.trim() === "")
        ) {
          form.setValue("userName", selectedEmployee.employeeNumber);
        }

        setHasAutoFilled(true);
        toast.info("User details auto-filled from employee information");
      }
    }
  }, [
    selectedEmployee,
    selectedEmployeeId,
    currentName,
    currentEmail,
    currentPhone,
    currentUserName,
    type,
    form,
    hasAutoFilled,
  ]);

  // Reset auto-fill flag when employee is deselected
  useEffect(() => {
    if (selectedEmployeeId === "no-employee" || !selectedEmployeeId) {
      setHasAutoFilled(false);
    }
  }, [selectedEmployeeId]);

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting form data:", values);

      // Prepare data for API
      const submitData = {
        ...values,
        // If employeeId is "no-employee", send null instead
        employeeId:
          values.employeeId === "no-employee" ? null : values.employeeId,
      };

      if (type === "create") {
        await axios.post("/api/users", submitData);
        toast.success("User created successfully");
      } else if (type === "update" && data?.id) {
        await axios.put(`/api/users/${data.id}`, submitData);
        toast.success("User updated successfully");
      }

      form.reset();
      router.refresh();
      onSubmitSuccess?.();
      onCancel?.();
    } catch (error: any) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.response?.data?.error || "Something went wrong!";
      toast.error(errorMessage);
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

  // Manual fill function
  const fillFromEmployee = () => {
    if (selectedEmployee && selectedEmployeeId !== "no-employee") {
      const employeeFullName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;

      form.setValue("name", employeeFullName);

      if (selectedEmployee.email) {
        form.setValue("email", selectedEmployee.email);
      }

      if (selectedEmployee.phone) {
        form.setValue("phone", selectedEmployee.phone);
      }

      if (type === "create") {
        const username =
          selectedEmployee.email?.split("@")[0] ||
          `${selectedEmployee.firstName.toLowerCase()}.${selectedEmployee.lastName.toLowerCase()}`;
        form.setValue("userName", username);
      }

      toast.success("User details filled from employee information");
    }
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
                      <SelectItem
                        key={employee.id}
                        value={employee.id}
                        disabled={
                          employee.isLinked && employee.id !== data?.employeeId
                        }
                      >
                        {employee.firstName} {employee.lastName} (
                        {employee.employeeNumber})
                        {employee.email && ` - ${employee.email}`}
                        {employee.isLinked &&
                          employee.id !== data?.employeeId &&
                          " (Already linked)"}
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

          {/* Show currently linked employee info for update */}
          {type === "update" &&
            currentLinkedEmployee &&
            !selectedEmployeeId && (
              <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900">
                  Currently Linked Employee:
                </h4>
                <p className="text-sm text-amber-800">
                  <strong>Name:</strong> {currentLinkedEmployee.firstName}{" "}
                  {currentLinkedEmployee.lastName}
                  <br />
                  <strong>Employee #:</strong>{" "}
                  {currentLinkedEmployee.employeeNumber}
                  <br />
                  <strong>Position:</strong> {currentLinkedEmployee.position}
                  <br />
                  {currentLinkedEmployee.department && (
                    <>
                      <strong>Department:</strong>{" "}
                      {currentLinkedEmployee.department.name}
                    </>
                  )}
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  This employee is currently linked to this user. Select "No
                  employee linked" to unlink.
                </p>
              </div>
            )}

          {/* Show selected employee info */}
          {selectedEmployee && selectedEmployeeId !== "no-employee" && (
            <div className="md:col-span-2 p-3 bg-blue-50 dark:bg-zinc-600 border border-blue-200  rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-zinc-300">
                    Selected Employee:
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-zinc-300">
                    <strong>Name:</strong> {selectedEmployee.firstName}{" "}
                    {selectedEmployee.lastName}
                    <br />
                    <strong>Employee #:</strong>{" "}
                    {selectedEmployee.employeeNumber}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillFromEmployee}
                  className="bg-white dark:bg-zinc-600  hover:bg-blue-100 dark:hover:bg-zinc-400"
                >
                  Fill User Details
                </Button>
              </div>
              <p className="text-xs text-blue-700 dark:text-white mt-2">
                User details will be automatically filled when fields are empty,
                or click "Fill User Details" to manually fill all fields.
              </p>
            </div>
          )}

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
