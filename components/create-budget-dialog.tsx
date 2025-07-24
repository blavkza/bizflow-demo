"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Calculator } from "lucide-react"

interface BudgetCategory {
  id: string
  name: string
  amount: number
  description: string
}

export function CreateBudgetDialog() {
  const [open, setOpen] = useState(false)
  const [budgetName, setBudgetName] = useState("")
  const [budgetPeriod, setBudgetPeriod] = useState("")
  const [budgetYear, setBudgetYear] = useState("")
  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: "1", name: "Salaries", amount: 0, description: "" },
    { id: "2", name: "Office Expenses", amount: 0, description: "" },
    { id: "3", name: "Marketing", amount: 0, description: "" },
  ])

  const addCategory = () => {
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      description: "",
    }
    setCategories([...categories, newCategory])
  }

  const removeCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id))
  }

  const updateCategory = (id: string, field: keyof BudgetCategory, value: string | number) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat)))
  }

  const totalBudget = categories.reduce((sum, cat) => sum + cat.amount, 0)

  const handleSubmit = () => {
    // Handle budget creation logic here
    console.log("Creating budget:", {
      name: budgetName,
      period: budgetPeriod,
      year: budgetYear,
      categories,
      total: totalBudget,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create New Budget
          </DialogTitle>
          <DialogDescription>
            Set up a new budget plan with categories and allocations for better financial management.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-name">Budget Name</Label>
                  <Input
                    id="budget-name"
                    placeholder="e.g., Q2 2024 Budget"
                    value={budgetName}
                    onChange={(e) => setBudgetName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-period">Period</Label>
                  <Select value={budgetPeriod} onValueChange={setBudgetPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-year">Year</Label>
                  <Select value={budgetYear} onValueChange={setBudgetYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Budget</Label>
                  <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                    <span className="text-lg font-semibold">R{totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Budget Categories</CardTitle>
              <Button onClick={addCategory} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category, index) => (
                <div key={category.id} className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-3 space-y-2">
                      <Label>Category Name</Label>
                      <Input
                        placeholder="Category name"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Amount (ZAR)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={category.amount || ""}
                        onChange={(e) => updateCategory(category.id, "amount", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional description"
                        value={category.description}
                        onChange={(e) => updateCategory(category.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      {categories.length > 1 && (
                        <Button
                          onClick={() => removeCategory(category.id)}
                          size="sm"
                          variant="outline"
                          className="h-10 w-10 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < categories.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Categories:</span>
                    <span className="font-medium">{categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Period:</span>
                    <span className="font-medium capitalize">{budgetPeriod || "Not selected"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Budget:</span>
                    <span className="font-bold text-lg">R{totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average per Category:</span>
                    <span className="font-medium">
                      R{categories.length > 0 ? Math.round(totalBudget / categories.length).toLocaleString() : "0"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!budgetName || !budgetPeriod || !budgetYear || totalBudget === 0}>
            Create Budget
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
