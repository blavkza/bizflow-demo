"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  PackageIcon,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Tag,
  Grid3x3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Link from "next/link";
import Image from "next/image";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Package, PackageStatus, PackageType } from "@prisma/client";

// API types
interface PackageWithDetails extends Package {
  packageProducts: any[];
  packageServices: any[];
  salesCount: number;
  totalRevenue: number;
}

interface CreatePackageData {
  name: string;
  description?: string;
  shortDescription?: string;
  classification?: string;
  category?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration?: string;
  packageType: PackageType;
  status?: PackageStatus;
  featured?: boolean;
  thumbnail?: string;
  tags?: string[];
  features?: string[];
  benefits?: string[];
  packageProductIds?: string[];
  packageServiceIds?: string[];
}

// API functions
const api = {
  // Fetch packages
  async getPackages(params?: {
    search?: string;
    classification?: string;
    category?: string;
    status?: string;
  }): Promise<PackageWithDetails[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (
      params?.classification &&
      params.classification !== "All Classifications"
    )
      queryParams.append("classification", params.classification);
    if (params?.category && params.category !== "All Categories")
      queryParams.append("category", params.category);
    if (params?.status && params.status !== "All Status")
      queryParams.append("status", params.status);

    const response = await fetch(`/api/packages?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch packages");
    return response.json();
  },

  // Create package
  async createPackage(data: CreatePackageData): Promise<Package> {
    const response = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create package");
    return response.json();
  },

  // Update package
  async updatePackage(
    id: string,
    data: Partial<CreatePackageData>
  ): Promise<Package> {
    const response = await fetch(`/api/packages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update package");
    return response.json();
  },

  // Delete package
  async deletePackage(id: string): Promise<void> {
    const response = await fetch(`/api/packages/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete package");
  },

  // Get package statistics
  async getPackageStats(): Promise<{
    totalPackages: number;
    activePackages: number;
    totalRevenue: number;
    totalSales: number;
    featuredPackages: number;
  }> {
    const response = await fetch("/api/packages/stats");
    if (!response.ok) throw new Error("Failed to fetch package stats");
    return response.json();
  },
};

const classifications = [
  "All Classifications",
  "Class 1 A",
  "Class 1 B",
  "Class 2 A",
  "Class 2 B",
];
const categories = [
  "All Categories",
  "Web Development",
  "E-commerce",
  "Mobile Development",
  "Marketing",
  "Starter",
  "Enterprise",
];
const statusOptions = ["All Status", "ACTIVE", "INACTIVE", "DRAFT"];
const packageTypes = ["BUNDLE", "PRODUCT_ONLY", "SERVICE_ONLY"];

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "draft":
      return "bg-yellow-100 text-yellow-800";
    case "archived":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getClassificationColor(classification: string) {
  switch (classification) {
    case "Class 1 A":
      return "bg-purple-100 text-purple-800";
    case "Class 1 B":
      return "bg-blue-100 text-blue-800";
    case "Class 2 A":
      return "bg-orange-100 text-orange-800";
    case "Class 2 B":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPackageTypeColor(type: string) {
  switch (type) {
    case "BUNDLE":
      return "bg-purple-100 text-purple-800";
    case "PRODUCT_ONLY":
      return "bg-blue-100 text-blue-800";
    case "SERVICE_ONLY":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalRevenue: 0,
    totalSales: 0,
    featuredPackages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassification, setSelectedClassification] = useState(
    "All Classifications"
  );
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CreatePackageData>({
    name: "",
    description: "",
    shortDescription: "",
    classification: "",
    category: "",
    price: 0,
    originalPrice: 0,
    discount: 0,
    duration: "",
    packageType: "BUNDLE",
    status: "DRAFT",
    featured: false,
    thumbnail: "",
    tags: [],
    features: [],
    benefits: [],
    packageProductIds: [],
    packageServiceIds: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch packages and stats
  useEffect(() => {
    fetchPackages();
    fetchStats();
  }, []);

  // Fetch packages with filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPackages();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedClassification, selectedCategory, selectedStatus]);

  async function fetchPackages() {
    try {
      setLoading(true);
      const data = await api.getPackages({
        search: searchTerm,
        classification: selectedClassification,
        category: selectedCategory,
        status: selectedStatus,
      });
      setPackages(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await api.getPackageStats();
      setStats(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  }

  async function handleCreatePackage() {
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (formData.price <= 0) errors.price = "Price must be greater than 0";
    if (!formData.packageType) errors.packageType = "Package type is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await api.createPackage(formData);
      toast({
        title: "Success",
        description: "Package created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPackages();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    }
  }

  async function handleDeletePackage(id: string) {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      setIsDeleting(id);
      await api.deletePackage(id);
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      fetchPackages();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      classification: "",
      category: "",
      price: 0,
      originalPrice: 0,
      discount: 0,
      duration: "",
      packageType: "BUNDLE",
      status: "DRAFT",
      featured: false,
      thumbnail: "",
      tags: [],
      features: [],
      benefits: [],
      packageProductIds: [],
      packageServiceIds: [],
    });
    setFormErrors({});
  }

  function formatPrice(price: number | null | undefined) {
    if (!price) return "R0.00";
    return `R${price.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function calculateDiscount(
    price: number,
    originalPrice: number | null | undefined
  ) {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  if (loading) {
    return <PackagesLoading />;
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Packages</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage product and service packages with classifications
          </p>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Package</DialogTitle>
                <DialogDescription>
                  Bundle products and services into a package offering.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name *</Label>
                  <Input
                    id="packageName"
                    placeholder="Enter package name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name)
                        setFormErrors({ ...formErrors, name: "" });
                    }}
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Brief tagline"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shortDescription: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed package description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classification">Classification</Label>
                    <Select
                      value={formData.classification}
                      onValueChange={(value) =>
                        setFormData({ ...formData, classification: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classifications.slice(1).map((classification) => (
                          <SelectItem
                            key={classification}
                            value={classification}
                          >
                            {classification}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (ZAR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.price || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, price: value });
                        if (formErrors.price)
                          setFormErrors({ ...formErrors, price: "" });
                      }}
                      className={formErrors.price ? "border-red-500" : ""}
                    />
                    {formErrors.price && (
                      <p className="text-sm text-red-500">{formErrors.price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.originalPrice || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., One-time, 3 months, 1 year"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageType">Package Type *</Label>
                  <Select
                    value={formData.packageType}
                    onValueChange={(value: PackageType) => {
                      setFormData({ ...formData, packageType: value });
                      if (formErrors.packageType)
                        setFormErrors({ ...formErrors, packageType: "" });
                    }}
                  >
                    <SelectTrigger
                      className={formErrors.packageType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {packageTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.packageType && (
                    <p className="text-sm text-red-500">
                      {formErrors.packageType}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: PackageStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.slice(1).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    placeholder="Feature 1\nFeature 2\nFeature 3"
                    rows={3}
                    value={formData.features?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        features: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="tag1, tag2, tag3"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePackage}>Create Package</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Packages
              </CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPackages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePackages} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{(stats.totalRevenue / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground">From all packages</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Packages sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Package Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R
                {stats.totalSales > 0
                  ? (stats.totalRevenue / stats.totalSales).toFixed(0)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per sale</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featuredPackages}</div>
              <p className="text-xs text-muted-foreground">Premium packages</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={selectedClassification}
            onValueChange={setSelectedClassification}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent>
              {classifications.map((classification) => (
                <SelectItem key={classification} value={classification}>
                  {classification}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
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
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Packages Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const discount = calculateDiscount(pkg.price, pkg.originalPrice);
              return (
                <Card
                  key={pkg.id}
                  className="hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {pkg.thumbnail && (
                    <div className="aspect-video relative bg-gradient-to-br from-primary/10 to-primary/5">
                      <Image
                        src={pkg.thumbnail}
                        alt={pkg.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {pkg.featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          Featured
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {pkg.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {pkg.shortDescription || pkg.name}
                        </CardDescription>
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
                            <Link href={`/packages/${pkg.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/packages/${pkg.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Package
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeletePackage(pkg.id)}
                            disabled={isDeleting === pkg.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting === pkg.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {pkg.classification && (
                        <Badge
                          className={getClassificationColor(pkg.classification)}
                        >
                          {pkg.classification}
                        </Badge>
                      )}
                      {pkg.category && (
                        <Badge variant="outline">{pkg.category}</Badge>
                      )}
                      <Badge className={getStatusColor(pkg.status)}>
                        {pkg.status}
                      </Badge>
                      <Badge className={getPackageTypeColor(pkg.packageType)}>
                        {pkg.packageType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description || "No description available"}
                    </p>

                    {/* Pricing */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(pkg.price)}
                        </span>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(pkg.originalPrice)}
                            </span>
                            <Badge variant="destructive">{discount}% OFF</Badge>
                          </>
                        )}
                      </div>
                      {pkg.duration && (
                        <p className="text-xs text-muted-foreground">
                          {pkg.duration}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Included:</p>
                        <ul className="space-y-1">
                          {pkg.features.slice(0, 3).map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span className="flex-1">{feature}</span>
                            </li>
                          ))}
                          {pkg.features.length > 3 && (
                            <li className="text-xs text-primary font-medium">
                              +{pkg.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <div className="text-lg font-semibold">
                          {pkg.salesCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sales
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          R{((pkg.totalRevenue || 0) / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Revenue
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {pkg.tags && pkg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pkg.tags.slice(0, 3).map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button className="w-full" asChild>
                      <Link href={`/packages/${pkg.id}`}>View Package</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {packages.map((pkg) => {
                  const discount = calculateDiscount(
                    pkg.price,
                    pkg.originalPrice
                  );
                  return (
                    <div
                      key={pkg.id}
                      className="p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {pkg.thumbnail && (
                          <div className="w-32 h-24 relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={pkg.thumbnail}
                              alt={pkg.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {pkg.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {pkg.shortDescription || "No description"}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/packages/${pkg.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/packages/${pkg.id}/edit`}>
                                    Edit Package
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  disabled={isDeleting === pkg.id}
                                >
                                  {isDeleting === pkg.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {pkg.classification && (
                              <Badge
                                className={getClassificationColor(
                                  pkg.classification
                                )}
                              >
                                {pkg.classification}
                              </Badge>
                            )}
                            {pkg.category && (
                              <Badge variant="outline">{pkg.category}</Badge>
                            )}
                            <Badge className={getStatusColor(pkg.status)}>
                              {pkg.status}
                            </Badge>
                            <Badge
                              className={getPackageTypeColor(pkg.packageType)}
                            >
                              {pkg.packageType}
                            </Badge>
                            {pkg.featured && (
                              <Badge className="bg-yellow-500 text-white">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-xl font-bold text-primary">
                                  {formatPrice(pkg.price)}
                                </span>
                                {pkg.originalPrice &&
                                  pkg.originalPrice > pkg.price && (
                                    <span className="text-sm text-muted-foreground line-through ml-2">
                                      {formatPrice(pkg.originalPrice)}
                                    </span>
                                  )}
                              </div>
                              {pkg.duration && (
                                <span className="text-sm text-muted-foreground">
                                  • {pkg.duration}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="font-semibold">
                                  {pkg.salesCount || 0}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  sales
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold">
                                  R{((pkg.totalRevenue || 0) / 1000).toFixed(0)}
                                  k
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  revenue
                                </span>
                              </div>
                            </div>
                          </div>
                          {pkg.tags && pkg.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pkg.tags.map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  );
}

function PackagesLoading() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Packages</h1>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="aspect-video w-full bg-gray-200 animate-pulse" />
              <CardHeader>
                <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SidebarInset>
  );
}
