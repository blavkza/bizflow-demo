"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ServicesLoadingSkeleton } from "./components/services-loading-skeleton";

// Enums
enum ServiceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  COMING_SOON = "COMING_SOON",
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  amount: number;
  currency: string;
  duration: string;
  status: ServiceStatus;
  clientsCount: number;
  revenue: number;
  completedProjects: number;
  activeProjects: number;
  features: string[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CategoryOption {
  label: string;
  value: string;
  type: string;
}

// Form validation schema
const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  duration: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
  features: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const statusOptions = [
  { label: "All Status", value: "ALL" },
  { label: "Active", value: ServiceStatus.ACTIVE },
  { label: "Inactive", value: ServiceStatus.INACTIVE },
  { label: "Coming Soon", value: ServiceStatus.COMING_SOON },
];

function getStatusColor(status: ServiceStatus) {
  switch (status) {
    case ServiceStatus.ACTIVE:
      return "bg-green-100 text-green-800";
    case ServiceStatus.INACTIVE:
      return "bg-gray-100 text-gray-800";
    case ServiceStatus.COMING_SOON:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusDisplayName(status: ServiceStatus) {
  switch (status) {
    case ServiceStatus.ACTIVE:
      return "Active";
    case ServiceStatus.INACTIVE:
      return "Inactive";
    case ServiceStatus.COMING_SOON:
      return "Coming Soon";
    default:
      return status;
  }
}

function getPricingLabel(amount: number) {
  return `R${amount.toLocaleString()}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      amount: "",
      duration: "",
      status: ServiceStatus.ACTIVE,
      features: "",
    },
  });

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await axios.get("/api/category");
      const categories: Category[] = response?.data || [];
      const options = categories
        .filter((category) => category.id && category.name)
        .map((category) => ({
          label: category.name || "",
          value: category.id,
          type: category.type,
        }));
      setCategoriesOptions(options);
      setCategories(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fetch all services
  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setAllServices(data);
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  // Filter services based on search term, category, and status
  useEffect(() => {
    let filtered = allServices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory
      );
    }

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(
        (service) => service.status === selectedStatus
      );
    }

    setServices(filtered);
  }, [searchTerm, selectedCategory, selectedStatus, allServices]);

  const handleCreateService = async (data: ServiceFormValues) => {
    try {
      // Find category name from ID
      const selectedCategory = categories.find(
        (cat) => cat.id === data.categoryId
      );

      const serviceData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        category: selectedCategory?.name || "",
        amount: parseFloat(data.amount),
        duration: data.duration,
        status: data.status,
        features: data.features
          ? data.features.split(",").map((f: string) => f.trim())
          : [],
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        const newService = await response.json();
        setIsCreateDialogOpen(false);
        form.reset();
        // Add new service to both allServices and filtered services
        setAllServices((prev) => [newService, ...prev]);
        toast.success("Service created successfully");
      } else {
        toast.error("Failed to create service");
      }
    } catch (error) {
      console.error("Failed to create service:", error);
      toast.error("Failed to create service");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove service from both allServices and filtered services
        setAllServices((prev) => prev.filter((service) => service.id !== id));
        toast.success("Service deleted successfully");
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
    }
  };

  // Get category options for filter dropdown
  const categoryFilterOptions = [
    "All Categories",
    ...Array.from(new Set(allServices.map((service) => service.category))),
  ];

  // Calculate summary statistics from all services (not filtered)
  const totalServices = allServices.length;
  const activeServices = allServices.filter(
    (s) => s.status === ServiceStatus.ACTIVE
  ).length;
  const totalRevenue = allServices.reduce((sum, s) => sum + s.revenue, 0);
  const totalClients = allServices.reduce((sum, s) => sum + s.clientsCount, 0);
  const totalProjects = allServices.reduce(
    (sum, s) => sum + s.completedProjects,
    0
  );
  const activeProjects = allServices.reduce(
    (sum, s) => sum + s.activeProjects,
    0
  );

  if (loading) {
    return <ServicesLoadingSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Services</h2>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service offering for your business.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateService)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter service name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Service description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Category</FormLabel>
                          <Combobox
                            options={categoriesOptions}
                            value={field.value}
                            onChange={field.onChange}
                            isLoading={isLoadingCategories}
                            placeholder="Select category"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (ZAR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2-4 weeks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={ServiceStatus.ACTIVE}>
                                Active
                              </SelectItem>
                              <SelectItem value={ServiceStatus.INACTIVE}>
                                Inactive
                              </SelectItem>
                              <SelectItem value={ServiceStatus.COMING_SOON}>
                                Coming Soon
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Features (comma-separated)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Feature 1, Feature 2, Feature 3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit">Create Service</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards - Show statistics from ALL services */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {activeServices} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From all services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Across all services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Total projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {totalServices > 0
                ? (totalRevenue / totalServices).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryFilterOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid - Show filtered services */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(service.status)}>
                      {getStatusDisplayName(service.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/services/${service.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {/* <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete Service
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description || "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{service.category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {service.duration}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-lg font-bold">
                        {getPricingLabel(service.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {service.clientsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Clients
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {service.completedProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {service.activeProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Active
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">
                      Key Features:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                      {service.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{service.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Revenue:
                      </span>
                      <span className="font-semibold">
                        R{service.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {service.name}
                          </h3>
                          <Badge className={getStatusColor(service.status)}>
                            {getStatusDisplayName(service.status)}
                          </Badge>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {service.description || "N/A"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {getPricingLabel(service.amount)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                            <span>{service.duration}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                            <span>{service.clientsCount} clients</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle2 className="mr-1 h-4 w-4 text-muted-foreground" />
                            <span>
                              {service.completedProjects} completed,{" "}
                              {service.activeProjects} active
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/services/${service.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>

                          {/*    <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete Service
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {services.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ||
              selectedCategory !== "All Categories" ||
              selectedStatus !== "ALL"
                ? "No services match your current filters. Try adjusting your search criteria."
                : "No services have been created yet. Create your first service to get started."}
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedStatus("ALL");
              }}
            >
              {searchTerm ||
              selectedCategory !== "All Categories" ||
              selectedStatus !== "ALL"
                ? "Clear Filters"
                : "Create Service"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
