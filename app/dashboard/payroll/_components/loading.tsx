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
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Separator orientation="vertical" className="h-4" />
        <Skeleton className="h-6 w-40" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Worker Information & Stats Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment History Loading */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-[180px]" />
              <Skeleton className="h-9 w-[120px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(5)].map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
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
