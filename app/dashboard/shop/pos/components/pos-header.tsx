import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Package } from "lucide-react";
import { CartItem } from "@/types/pos";

interface POSHeaderProps {
  cart: CartItem[];
}

export function POSHeader({ cart }: POSHeaderProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
      <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/shop/sales">
            <FileText className="h-4 w-4 mr-2" />
            Sales History
          </Link>
        </Button>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Package className="h-4 w-4 mr-2" />
          {totalItems} Items
        </Badge>
      </div>
    </div>
  );
}
