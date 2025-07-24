"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <div className="flex flex-col p-6">
      {/* Header Loading */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Separator orientation="vertical" className="h-4" />
        <Skeleton className="h-6 w-40" />
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Worker Profile Loading */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Worker Information & Stats Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Loading */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Skeleton className="absolute left-2 top-2.5 h-4 w-4 rounded-full" />
                <Skeleton className="h-9 w-full pl-8" />
              </div>
              <Skeleton className="h-9 w-[180px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Date", "Type", "Amount", "Status", "Actions"].map(
                    (header) => (
                      <TableHead key={header}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
