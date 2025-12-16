import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { CartItem } from "@/types/pos";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface POSHeaderProps {
  cart: CartItem[];
  scanNotice?: {
    message: string;
    type: "error" | "warning" | "info";
    visible: boolean;
  };
}

export function POSHeader({ cart, scanNotice }: POSHeaderProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "info":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNoticeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Point Of Sale</h1>
        </div>
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

      {scanNotice?.visible && (
        <Alert variant={getNoticeVariant(scanNotice.type)} className="mb-4">
          {getNoticeIcon(scanNotice.type)}
          <AlertDescription>{scanNotice.message}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
