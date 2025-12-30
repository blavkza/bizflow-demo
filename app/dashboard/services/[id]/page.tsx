"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Edit,
  MoreHorizontal,
  Building,
  Mail,
  Phone,
  User,
  FileText,
  PlayCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { ServiceLoadingSkeleton } from "./components/service-loading-skeleton";

// Enums
enum ServiceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  COMING_SOON = "COMING_SOON",
}

enum ProjectStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

enum ClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

enum ClientType {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
}

interface Client {
  id: string;
  clientNumber: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: ClientStatus;
  type: ClientType;
  avatar?: string;
}

interface Project {
  id: string;
  projectNumber: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  budgetSpent?: number;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  client?: Client;
  manager?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  _count: {
    tasks: number;
    timeEntries: number;
    invoices: number;
  };
}

interface Service {
  id: string;
  name: string;
  description?: string | "N/A";
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
  projects?: Project[]; // Make optional
  clients?: Client[]; // Make optional
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

function getProjectStatusColor(status: ProjectStatus) {
  switch (status) {
    case ProjectStatus.PLANNING:
      return "bg-blue-100 text-blue-800";
    case ProjectStatus.IN_PROGRESS:
      return "bg-yellow-100 text-yellow-800";
    case ProjectStatus.ON_HOLD:
      return "bg-orange-100 text-orange-800";
    case ProjectStatus.COMPLETED:
      return "bg-green-100 text-green-800";
    case ProjectStatus.CANCELLED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getProjectStatusDisplayName(status: ProjectStatus) {
  switch (status) {
    case ProjectStatus.PLANNING:
      return "Planning";
    case ProjectStatus.IN_PROGRESS:
      return "In Progress";
    case ProjectStatus.ON_HOLD:
      return "On Hold";
    case ProjectStatus.COMPLETED:
      return "Completed";
    case ProjectStatus.CANCELLED:
      return "Cancelled";
    default:
      return status;
  }
}

function getClientStatusColor(status: ClientStatus) {
  switch (status) {
    case ClientStatus.ACTIVE:
      return "bg-green-100 text-green-800";
    case ClientStatus.INACTIVE:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPricingLabel(amount: number) {
  return `R${amount.toLocaleString()}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Safe array access helper functions
const getProjects = (service: Service | null): Project[] => {
  return service?.projects || [];
};

const getClients = (service: Service | null): Client[] => {
  return service?.clients || [];
};

const getFeatures = (service: Service | null): string[] => {
  return service?.features || [];
};

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>(
    []
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

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

  useEffect(() => {
    if (serviceId) {
      fetchService();
      fetchCategories();
    }
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setService(data);

        // Pre-populate form with service data
        form.reset({
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          amount: data.amount.toString(),
          duration: data.duration,
          status: data.status,
          features: Array.isArray(data.features)
            ? data.features.join(", ")
            : "",
        });
      } else {
        toast.error("Failed to fetch service");
      }
    } catch (error) {
      console.error("Failed to fetch service:", error);
      toast.error("Failed to fetch service");
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (data: ServiceFormValues) => {
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

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        const updatedService = await response.json();
        setService(updatedService);
        setIsEditDialogOpen(false);
        toast.success("Service updated successfully");
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error("Failed to update service");
    }
  };

  const handleDeleteService = async () => {
    if (!service || !confirm("Are you sure you want to delete this service?"))
      return;

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Service deleted successfully");
        window.location.href = "/services";
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
    }
  };

  if (loading) {
    return <ServiceLoadingSkeleton />;
  }

  if (!service) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The service you're looking for doesn't exist.
          </p>
          <div onClick={() => router.back()}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div onClick={() => router.back()}>
            <Button variant={"outline"}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {service.name}
            </h1>
            <p className="text-muted-foreground">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Service
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Duplicate Service</DropdownMenuItem>
              <DropdownMenuItem>View Projects</DropdownMenuItem>
              <DropdownMenuItem>View Clients</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleDeleteService}
              >
                Delete Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service information below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEditService)}
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
                      <Textarea placeholder="Service description" {...field} />
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
              </div>

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
                <Button type="submit">Update Service</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status and Category Badges */}
      <div className="flex items-center space-x-4">
        <Badge
          className={`${getStatusColor(service.status)} text-sm px-3 py-1`}
        >
          {getStatusDisplayName(service.status)}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {service.category}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Created on {new Date(service.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({getProjects(service).length})
          </TabsTrigger>
          <TabsTrigger value="clients">
            Clients ({getClients(service).length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getPricingLabel(service.amount)}
                </div>
                <p className="text-xs text-muted-foreground">Fixed price</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.duration}</div>
                <p className="text-xs text-muted-foreground">
                  Estimated timeline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.clientsCount}</div>
                <p className="text-xs text-muted-foreground">Unique clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getProjects(service).length}
                </div>
                <p className="text-xs text-muted-foreground">All projects</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    <span>Completed Projects</span>
                  </div>
                  <span className="font-semibold">
                    {service.completedProjects}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <PlayCircle className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Active Projects</span>
                  </div>
                  <span className="font-semibold">
                    {service.activeProjects}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Success Rate</span>
                  </div>
                  <span className="font-semibold">
                    {service.completedProjects + service.activeProjects > 0
                      ? Math.round(
                          (service.completedProjects /
                            (service.completedProjects +
                              service.activeProjects)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Category</span>
                  <Badge variant="outline">{service.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusDisplayName(service.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Currency</span>
                  <span className="text-sm">{service.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm">
                    {new Date(service.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {service.description || "N/A"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {getFeatures(service).map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 border rounded-lg"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects Using This Service</CardTitle>
            </CardHeader>
            <CardContent>
              {getProjects(service).length > 0 ? (
                <div className="space-y-4">
                  {getProjects(service).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{project.title}</h3>
                            <Badge
                              className={getProjectStatusColor(project.status)}
                            >
                              {getProjectStatusDisplayName(project.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {project.projectNumber} • {project.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <FileText className="mr-1 h-3 w-3" />
                              {project._count?.tasks || 0} tasks
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {project._count?.timeEntries || 0} time entries
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="mr-1 h-3 w-3" />
                              {project._count?.invoices || 0} invoices
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium mb-1">
                          Progress: {project.progress}%
                        </div>
                        {project.budget && (
                          <div className="text-sm text-muted-foreground">
                            Budget: R{project.budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No projects found using this service</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Clients Using This Service</CardTitle>
            </CardHeader>
            <CardContent>
              {getClients(service).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getClients(service).map((client) => (
                    <div key={client.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{client.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {client.clientNumber}
                            </Badge>
                            <Badge
                              className={`${getClientStatusColor(client.status)} text-xs`}
                            >
                              {client.status.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                        {client.company && (
                          <div className="flex items-center">
                            <Building className="mr-2 h-3 w-3 text-muted-foreground" />
                            <span>{client.company}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <User className="mr-2 h-3 w-3 text-muted-foreground" />
                          <span className="capitalize">
                            {client.type.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clients found using this service</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
