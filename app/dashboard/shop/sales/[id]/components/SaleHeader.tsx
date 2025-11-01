import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Mail, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Sale {
  id: string;
  saleNumber: string;
  status: string;
  saleDate: string;
}

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
  };
}

interface SaleHeaderProps {
  sale: Sale;
  statusConfig: StatusConfig;
  onPrintClick: () => void;
  onDownloadClick: () => void;
  onEmailClick: () => void;
  onQuickPrint: () => void;
}

export default function SaleHeader({
  sale,
  statusConfig,
  onPrintClick,
  onDownloadClick,
  onEmailClick,
  onQuickPrint,
}: SaleHeaderProps) {
  const statusConfigItem = statusConfig[sale.status] || statusConfig.PENDING;
  const StatusIcon = statusConfigItem.icon;
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{sale.saleNumber}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <StatusIcon className="h-4 w-4" />
            <Badge className={statusConfigItem.color}>
              {statusConfigItem.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(sale.saleDate).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {/* <Button variant="outline" size="sm" onClick={onQuickPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Quick Print
        </Button> */}
        <Button variant="outline" size="sm" onClick={onPrintClick}>
          <Printer className="mr-2 h-4 w-4" />
          Print Options
        </Button>
        {/*  <Button variant="outline" size="sm" onClick={onDownloadClick}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button> */}
        <Button variant="outline" size="sm" onClick={onEmailClick}>
          <Mail className="mr-2 h-4 w-4" />
          Email Receipt
        </Button>
      </div>
    </div>
  );
}
