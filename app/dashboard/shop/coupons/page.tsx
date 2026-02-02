"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { CouponsClient } from "./_components/coupons-client";
import { CouponColumn } from "./_components/columns";

import { CouponsSkeleton } from "./_components/coupons-skeleton";

const queryClient = new QueryClient();

export default function CouponsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <CouponsContent />
    </QueryClientProvider>
  );
}

function CouponsContent() {
  const { data: coupons = [], isLoading } = useQuery<CouponColumn[]>({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data } = await axios.get("/api/coupons");
      return data.map((item: any) => ({
        id: item.id,
        code: item.code,
        type: item.type,
        value: Number(item.value),
        minOrderAmount: item.minOrderAmount
          ? Number(item.minOrderAmount)
          : null,
        startDate: format(new Date(item.startDate), "yyyy-MM-dd"),
        endDate: item.endDate
          ? format(new Date(item.endDate), "yyyy-MM-dd")
          : "N/A",
        usageLimit: item.usageLimit,
        usedCount: item.usedCount,
        isActive: item.isActive,
        createdAt: format(new Date(item.createdAt), "MMMM do, yyyy"),
        products: item.products || [],
      }));
    },
  });

  if (isLoading) {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                 <CouponsSkeleton />
            </div>
        </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CouponsClient data={coupons} />
      </div>
    </div>
  );
}
