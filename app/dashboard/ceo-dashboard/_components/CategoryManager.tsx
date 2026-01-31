import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CategoryCeo,
  TransactionCeo,
  TransactionType,
  CategoryType,
} from "@prisma/client";
import CategoryForm from "./category-Form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CategoryManagerProps {
  categories: CategoryCeo[];
  transactions: TransactionCeo[];
}

const CategoryManager = ({
  categories: initialCategories,
  transactions,
}: CategoryManagerProps) => {
  const [categories, setCategories] =
    useState<CategoryCeo[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryCeo | null>(
    null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/categoryCeo");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Helper function to check if a transaction matches a category type
  const isTransactionForCategory = (
    transaction: TransactionCeo,
    categoryType: CategoryType
  ) => {
    if (categoryType === CategoryType.BOTH) return true;
    return transaction.type.toLowerCase() === categoryType.toLowerCase();
  };

  const getCategoryTransactions = (
    categoryId: string,
    categoryType: CategoryType
  ) => {
    return transactions.filter(
      (t) =>
        t.categoryCeoId === categoryId &&
        isTransactionForCategory(t, categoryType)
    );
  };

  const getCategoryMetrics = (
    categoryId: string,
    categoryType: CategoryType
  ) => {
    const categoryTransactions = getCategoryTransactions(
      categoryId,
      categoryType
    );
    const totalAmount = categoryTransactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );
    return {
      totalAmount,
      transactionCount: categoryTransactions.length,
      type: categoryType,
    };
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleEdit = (category: CategoryCeo) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/categoryCeo/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Search and filter categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter categories by type
  const expenseCategories = filteredCategories.filter(
    (cat) => cat.type === CategoryType.EXPENSE
  );
  const incomeCategories = filteredCategories.filter(
    (cat) => cat.type === CategoryType.INCOME
  );
  const bothCategories = filteredCategories.filter(
    (cat) => cat.type === CategoryType.BOTH
  );

  const renderCategoryCard = (category: CategoryCeo) => {
    const metrics = getCategoryMetrics(category.id, category.type);
    const categoryTransactions = getCategoryTransactions(
      category.id,
      category.type
    );
    const isExpanded = expandedCategories.has(category.id);

    // Determine icon and color based on category type
    const getCategoryIcon = () => {
      switch (category.type) {
        case CategoryType.INCOME:
          return <TrendingUp className="w-4 h-4 text-success mr-1" />;
        case CategoryType.EXPENSE:
          return <TrendingDown className="w-4 h-4 text-destructive mr-1" />;
        case CategoryType.BOTH:
          return <DollarSign className="w-4 h-4 text-primary mr-1" />;
        default:
          return <DollarSign className="w-4 h-4 text-muted-foreground mr-1" />;
      }
    };

    return (
      <Card
        key={category.id}
        className="overflow-hidden hover:shadow-card transition-shadow"
      >
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleCategoryExpansion(category.id)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {category.name}
                </span>
                {category.type === CategoryType.BOTH && (
                  <Badge variant="outline" className="text-xs">
                    Both
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  {getCategoryIcon()}
                  <span className="text-xs font-medium text-muted-foreground">
                    Total
                  </span>
                </div>
                <p className="text-lg font-bold">
                  R{metrics.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="w-4 h-4 text-primary mr-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Count
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {metrics.transactionCount}
                </p>
              </div>
            </div>

            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <span className="text-sm text-muted-foreground">
                  {categoryTransactions.length > 0
                    ? `View ${categoryTransactions.length} transaction${categoryTransactions.length > 1 ? "s" : ""}`
                    : "No transactions yet"}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="px-4 pb-4 border-t bg-muted/20">
              {categoryTransactions.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <p className="text-sm">
                    No transactions in this category yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-4">
                  {categoryTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-2 bg-card rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-sm ${
                            transaction.type === TransactionType.INCOME
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {transaction.type === TransactionType.EXPENSE && "-"}R
                          {Math.abs(
                            Number(transaction.amount)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Category Management
          </h2>
          <p className="text-muted-foreground">
            Organize your transactions with custom categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingCategory(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant={"outline"}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the category details below."
                  : "Create a new category for organizing transactions."}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              type={editingCategory ? "update" : "create"}
              data={editingCategory || undefined}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingCategory(null);
              }}
              onSubmitSuccess={() => {
                setIsDialogOpen(false);
                setEditingCategory(null);
                fetchCategories();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-destructive" />
            Expense Categories ({expenseCategories.length})
          </h3>
          <div className="space-y-4">
            {expenseCategories.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No expense categories yet. Add one to get started.
                </p>
              </Card>
            ) : (
              expenseCategories.map(renderCategoryCard)
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-success" />
            Income Categories ({incomeCategories.length})
          </h3>
          <div className="space-y-4">
            {incomeCategories.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No income categories yet. Add one to get started.
                </p>
              </Card>
            ) : (
              incomeCategories.map(renderCategoryCard)
            )}
          </div>
        </div>

        {bothCategories.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Mixed Categories ({bothCategories.length})
            </h3>
            <div className="space-y-4">
              {bothCategories.map(renderCategoryCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
