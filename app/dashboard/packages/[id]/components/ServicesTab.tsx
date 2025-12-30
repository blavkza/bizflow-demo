"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Wrench } from "lucide-react";
import { PackageData, PackageService } from "../types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ServicesTabProps {
  packageData: PackageData;
}

export default function ServicesTab({ packageData }: ServicesTabProps) {
  // Get all services across all subpackages
  const allServices = packageData.subpackages.flatMap(
    (subpackage) =>
      subpackage.services?.map((service) => ({
        ...service,
        subpackageName: subpackage.name,
        subpackageId: subpackage.id,
      })) || []
  );

  // Create a map to deduplicate services by service ID
  const serviceMap = new Map<
    string,
    (typeof allServices)[0] & {
      subpackages: string[];
    }
  >();

  allServices.forEach((service) => {
    if (serviceMap.has(service.id)) {
      const existing = serviceMap.get(service.id)!;
      if (!existing.subpackages.includes(service.subpackageName)) {
        existing.subpackages.push(service.subpackageName);
      }
    } else {
      serviceMap.set(service.id, {
        ...service,
        subpackages: [service.subpackageName],
      });
    }
  });

  // Convert map to array of deduplicated services
  const deduplicatedServices = Array.from(serviceMap.values());

  const getTotalServiceValue = () => {
    return deduplicatedServices.reduce((total, service) => {
      const price = service.amount || service.price || 0;
      return total + price;
    }, 0);
  };

  // Calculate average duration
  const getAverageDuration = () => {
    const durations = deduplicatedServices
      .map((s) => s.duration)
      .filter(Boolean) as string[];

    if (durations.length === 0) return "N/A";

    // Try to parse durations (assuming format like "4 weeks", "2 days", etc.)
    // For simplicity, return the most common duration or first one
    const durationCounts: Record<string, number> = {};
    durations.forEach((duration) => {
      durationCounts[duration] = (durationCounts[duration] || 0) + 1;
    });

    const mostCommonDuration = Object.entries(durationCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    return mostCommonDuration;
  };

  if (deduplicatedServices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No services found</h3>
          <p className="text-sm text-muted-foreground text-center">
            This package doesn't contain any services yet. Add services to
            subpackages to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unique Services</p>
              <p className="text-2xl font-bold">
                {deduplicatedServices.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-2xl font-bold">{getAverageDuration()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                R{getTotalServiceValue().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services in Package</CardTitle>
          <CardDescription>
            {deduplicatedServices.length} unique services across{" "}
            {packageData.subpackages.length} subpackages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Subpackages</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>view</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deduplicatedServices.map((service, index) => {
                const price = service.amount || service.price || 0;

                return (
                  <TableRow key={`${service.id}-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {service.subpackages.map((subpackage, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {subpackage}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{service.category || "Uncategorized"}</TableCell>
                    <TableCell>{service.duration || "N/A"}</TableCell>
                    <TableCell>R{price.toLocaleString()}</TableCell>
                    <TableCell>
                      {service.features && service.features.length > 0 ? (
                        <div className="max-w-xs">
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {service.features.slice(0, 3).join(", ")}
                            {service.features.length > 3 && "..."}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.features.length} feature(s)
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No features
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/services/${service.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed view showing all entries (including duplicates) */}
      {allServices.length > deduplicatedServices.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Detailed Service Distribution
            </CardTitle>
            <CardDescription>
              Showing {allServices.length} service entries across all
              subpackages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deduplicatedServices.map((service) => {
                const servicePrice = service.amount || service.price || 0;

                return (
                  <div key={service.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-muted-foreground" />
                          <p className="font-medium">{service.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R{servicePrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration || "No duration"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">
                        Used in subpackages:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {service.subpackages.map((subpackage, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="justify-start"
                          >
                            {subpackage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {service.features && service.features.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.features.slice(0, 5).map((feature, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                          {service.features.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{service.features.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
