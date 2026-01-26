import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onPrint: () => void;
  onDownload: () => void;
  onEmail: () => void;
  onExcel: () => void;
  printing: boolean;
  downloading: boolean;
  emailing: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPrint,
  onDownload,
  onEmail,
  onExcel,
  printing,
  downloading,
  emailing,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onPrint} disabled={printing}>
        {printing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-2 h-4 w-4" />
        )}
        {printing ? "Printing..." : "Print"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {downloading ? "Downloading..." : "PDF"}
      </Button>
      {/*   <Button variant="outline" size="sm" onClick={onEmail} disabled={emailing}>
        {emailing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        {emailing ? "Sending..." : "Email"}
      </Button> */}
      <Button variant="outline" size="sm" onClick={onExcel}>
        <Download className="mr-2 h-4 w-4" />
        Excel
      </Button>
    </div>
  );
};

export default ActionButtons;
