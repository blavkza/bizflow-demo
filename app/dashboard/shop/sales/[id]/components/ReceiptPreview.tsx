import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";

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
  saleNumber: string;
  saleDate: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface CompanyInfo {
  companyName?: string;
  address?: string;
  phone?: string;
}

interface ReceiptPreviewProps {
  sale: Sale;
  companyInfo: CompanyInfo | null;
}

export default function ReceiptPreview({
  sale,
  companyInfo,
}: ReceiptPreviewProps) {
  const getProductName = (item: SaleItem) => {
    return item.ShopProduct?.name || "Product";
  };

  const companyName = companyInfo?.companyName || "FinanceFlow Solutions";
  const companyAddress =
    companyInfo?.address || "456 Corporate Ave, Sandton, 2196";
  const companyPhone = companyInfo?.phone || "+27 11 987 6543";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="h-5 w-5 mr-2" />
          Receipt Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{companyName}</h3>
            <p className="text-sm text-muted-foreground">{companyAddress}</p>
            <p className="text-sm text-muted-foreground">Tel: {companyPhone}</p>
          </div>
          <Separator className="my-3" />
          <div className="text-center mb-3">
            <p className="font-semibold">RECEIPT</p>
            <p className="text-sm">{sale.saleNumber}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(sale.saleDate).toLocaleString()}
            </p>
          </div>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            {sale.items.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span>{getProductName(item)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {item.quantity} x R{Number(item.price).toFixed(2)}
                  </span>
                  <span>R{Number(item.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R{Number(sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (15%):</span>
              <span>R{Number(sale.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>TOTAL:</span>
              <span>R{Number(sale.total).toFixed(2)}</span>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="text-center text-sm">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
