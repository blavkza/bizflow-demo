"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryForm from "./category-Form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { CategoryType } from "@prisma/client";
import { useState } from "react";

export type CategoryWithTransactions = {
  id: string;
  name: string;
  description: string | null;
  type: CategoryType;

  transactions: {
    id: string;
    amount: number;
  }[];
  transactionCount: number;
  totalAmount: number;
};

interface HeaderProps {
  categories: CategoryWithTransactions[];
  onSearch: (term: string) => void;
  onFilter: (type: "all" | "INCOME" | "EXPENSE") => void;
}

export default function Header({
  categories,
  onSearch,
  onFilter,
}: HeaderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search categories..."
            className="max-w-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Select
            onValueChange={(value: "all" | "INCOME" | "EXPENSE") =>
              onFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing transactions.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              type="create"
              onCancel={() => setIsAddDialogOpen(false)}
              onSubmitSuccess={() => {
                setIsAddDialogOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
