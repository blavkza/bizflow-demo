"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CategoryForm from "./category-Form";
import { CategoryStatus, CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Decimal } from "@prisma/client/runtime/library";
import { cn } from "@/lib/utils";

export type CategoryWithTransactions = {
  id: string;
  name: string;
  description: string | null;
  type: CategoryType;
  status: CategoryStatus;
  transactions: {
    id: string;
    amount: number | Decimal;
  }[];
  transactionCount: number;
  totalAmount: number;
};

const colorClasses = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-red-100 text-red-600",
  "bg-yellow-100 text-yellow-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
  "bg-teal-100 text-teal-600",
  "bg-orange-100 text-orange-600",
  "bg-cyan-100 text-cyan-600",
];

export default function CategoryCard({
  categories,
  fetchCategories,
}: {
  categories: CategoryWithTransactions[];
  fetchCategories: () => void;
}) {
  const router = useRouter();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  const getRandomColor = () => {
    return colorClasses[Math.floor(Math.random() * colorClasses.length)];
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.length > 0 ? (
        categories.map((category) => {
          const IconComponent = DollarSign;
          const colorClass = getRandomColor();

          return (
            <Card
              key={category.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge
                      className={cn(
                        `mt-1 text-white, ${category.type === CategoryType.INCOME ? "bg-green-500" : "bg-red-500"}`
                      )}
                    >
                      {category.type.toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog
                    open={editingCategoryId === category.id}
                    onOpenChange={(open) => {
                      setEditingCategoryId(open ? category.id : null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                          Update this category
                        </DialogDescription>
                      </DialogHeader>
                      <CategoryForm
                        type="update"
                        data={category}
                        onCancel={() => setEditingCategoryId(null)}
                        onSubmitSuccess={() => {
                          setEditingCategoryId(null);
                          if (fetchCategories) fetchCategories();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description || "No description"}
                </p>
                <div className="flex justify-between text-sm">
                  <span>Transactions: {category.transactionCount}</span>
                  <span
                    className={
                      category.type === CategoryType.INCOME
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {category.type === CategoryType.INCOME ? "+" : "-"}R
                    {Math.abs(category.totalAmount).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="col-span-full flex justify-center py-12">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      )}
    </div>
  );
}
