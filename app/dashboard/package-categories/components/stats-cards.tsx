import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderIcon, PackageIcon, FolderTree, CheckCircle } from "lucide-react";
import { CategoryStats } from "@/types/PackageCategory";

interface StatsCardsProps {
  stats: CategoryStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Categories",
      value: stats.totalCategories,
      icon: FolderIcon,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Active Categories",
      value: stats.activeCategories,
      icon: CheckCircle,
      color: "text-green-600 bg-green-100",
      description: `${Math.round((stats.activeCategories / stats.totalCategories) * 100)}% of total`,
    },
    {
      title: "With Packages",
      value: stats.categoriesWithPackages,
      icon: PackageIcon,
      color: "text-purple-600 bg-purple-100",
      description: `${Math.round((stats.categoriesWithPackages / stats.totalCategories) * 100)}% have packages`,
    },
    {
      title: "Nested Categories",
      value: stats.nestedCategories,
      icon: FolderTree,
      color: "text-orange-600 bg-orange-100",
      description: `${Math.round((stats.nestedCategories / stats.totalCategories) * 100)}% are sub-categories`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${card.color}`}
            >
              <card.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
