import { History, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockMovementsHistory } from "./StockMovementsHistory";
import { SalesHistory } from "./SalesHistory";

interface ProductHistoryTabsProps {
  productId: string;
}

export function ProductHistoryTabs({ productId }: ProductHistoryTabsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Product History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stock-movements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="stock-movements"
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Stock Movements
            </TabsTrigger>
            <TabsTrigger
              value="sales-history"
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Sales History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock-movements" className="space-y-4">
            <StockMovementsHistory productId={productId} />
          </TabsContent>

          <TabsContent value="sales-history" className="space-y-4">
            <SalesHistory productId={productId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
