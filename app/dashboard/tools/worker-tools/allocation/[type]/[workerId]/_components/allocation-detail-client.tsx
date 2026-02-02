"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, DollarSign, Hammer } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useState } from "react";
import { ReturnToolDialog } from "./return-tool-dialog";

interface AllocationDetailClientProps {
  type: string;
  workerId: string;
}

export function AllocationDetailClient({
  type,
  workerId,
}: AllocationDetailClientProps) {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["worker-allocation", type, workerId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/worker-tools/allocation/${type}/${workerId}`,
      );
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        Loading allocation details...
      </div>
    );
  }

  if (!data || !data.worker) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <h2 className="text-xl font-bold">Worker Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { worker, tools } = data;

  const totalValue = tools.reduce(
    (sum: number, t: any) => sum + Number(t.purchasePrice) * (t.quantity || 1),
    0,
  );
  const totalItems = tools.reduce(
    (sum: number, t: any) => sum + (t.quantity || 1),
    0,
  );

  const handleReturn = (tool: any) => {
    setSelectedTool(tool);
    setIsReturnOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{worker.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {worker.type}
            </Badge>
            {worker.position} • {worker.department}
            {worker.email && (
              <span className="flex items-center gap-1 ml-2">
                <Mail className="h-3 w-3" /> {worker.email}
              </span>
            )}
            {worker.phone && (
              <span className="flex items-center gap-1 ml-2">
                <Phone className="h-3 w-3" /> {worker.phone}
              </span>
            )}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-premium bg-background/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-base items-center flex justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-blue-600 rounded-full" />
              <span>Assigned Inventory</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hammer className="h-3 w-3" /> {totalItems} items
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(totalValue)}
              </span>
              <Badge variant="secondary" className="font-semibold">
                {tools.length} Records
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[80px] pl-6">Image</TableHead>
                <TableHead>Tool Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Date Assigned</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Damage Cost</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground h-40"
                  >
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Hammer className="h-10 w-10 mb-2" />
                      <p>No tools currently assigned.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tools
                  .filter((t: any) => t.quantity > 0)
                  .map((tool: any) => (
                    <TableRow
                      key={tool.id}
                      className="group hover:bg-muted/5 transition-colors"
                    >
                      <TableCell className="pl-6">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border shadow-sm bg-background">
                          {tool.images && tool.images[0] ? (
                            <Image
                              src={tool.images[0]}
                              alt={tool.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground font-medium">
                              NO IMG
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">{tool.name}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            {tool.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-blue-600">
                          {tool.quantity || 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {tool.serialNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tool.assignedDate
                          ? format(new Date(tool.assignedDate), "PPP")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tool.status === "DAMAGED"
                              ? "destructive"
                              : "outline"
                          }
                          className="capitalize text-[10px] font-bold"
                        >
                          {tool.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tool.damageCost && tool.damageCost > 0 ? (
                          <span className="text-destructive font-bold text-sm">
                            {new Intl.NumberFormat("en-ZA", {
                              style: "currency",
                              currency: "ZAR",
                            }).format(Number(tool.damageCost))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 font-bold">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        {new Intl.NumberFormat("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        }).format(Number(tool.purchasePrice))}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-blue-50/50 hover:bg-blue-600 hover:text-white border-blue-200 transition-all rounded-full"
                          onClick={() => handleReturn(tool)}
                        >
                          Return Tool
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReturnToolDialog
        tool={selectedTool}
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
