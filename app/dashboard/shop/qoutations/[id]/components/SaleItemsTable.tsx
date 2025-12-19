import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SaleItem {
  id: string;
  shopProductId: string;
  quantity: number;
  price: number;
  total: number;
  ShopProduct?: {
    name: string;
    sku: string;
  };
}

interface Sale {
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  total: number;
  refundedAmount?: number;
}

interface SaleItemsTableProps {
  sale: Sale;
}

export default function SaleItemsTable({ sale }: SaleItemsTableProps) {
  const getProductName = (item: SaleItem) => {
    return item.ShopProduct?.name || "Product";
  };

  const getProductSKU = (item: SaleItem) => {
    return item.ShopProduct?.sku || "N/A";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {getProductName(item)}
                </TableCell>
                <TableCell>{getProductSKU(item)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  R{Number(item.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  R{Number(item.total).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        {/* Sale Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R{Number(sale.subtotal).toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({sale.discountPercent}%):</span>
                <span>-R{Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (15%):</span>
              <span>R{Number(sale.tax).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>R{Number(sale.total).toFixed(2)}</span>
            </div>
            {sale.refundedAmount && sale.refundedAmount > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-red-600">
                  <span>Refunded:</span>
                  <span>-R{Number(sale.refundedAmount).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
