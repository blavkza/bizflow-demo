"use client";

import { useState, useEffect } from "react";
import { Tool } from "@/types/tool";
import { ToolHeader } from "./ToolHeader";
import { ToolImageGallery } from "./ToolImageGallery";
import { ToolStats } from "./ToolStats";
import { ToolTabs } from "./ToolTabs";
import { EditDialog } from "./EditDialog";
import { InterUseDialog } from "./InterUseDialog";
import { MaintenanceDialog } from "./MaintenanceDialog";
import { ToolDetailSkeleton } from "./ToolDetailSkeleton";
import { ToolReportGenerator } from "@/lib/toolReportGenerator";
import { toast } from "sonner";
import { safeNumber } from "../../utils";
import { useCompanyInfo } from "@/hooks/use-company-info";

interface ToolDetailViewProps {
  tool: Tool | null;
  loading: boolean;
  onUpdateTool: (data: any) => Promise<void>;
  onDeleteTool: () => Promise<void>;
  onAddMaintenance: (data: any) => Promise<void>;
  onAddInterUse: (data: any) => Promise<void>;
  loadTool: () => void;
}

export function ToolDetailView({
  tool,
  loading,
  onUpdateTool,
  onDeleteTool,
  loadTool,
  onAddMaintenance,
  onAddInterUse,
}: ToolDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isInterUseDialogOpen, setIsInterUseDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { companyInfo } = useCompanyInfo();

  const handlePrintReport = async () => {
    if (!tool) return;

    setIsPrinting(true);
    try {
      const toolReportHTML = ToolReportGenerator.generateToolReportHTML(
        tool,
        companyInfo
      );

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(toolReportHTML);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing tool report:", error);
      toast.error("Failed to generate tool report");
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return <ToolDetailSkeleton />;
  }

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-screen">
        Tool Not Found, Please Retry
      </div>
    );
  }

  // Calculate statistics
  const totalRentalRevenue = (tool.rentals || []).reduce((sum, rental) => {
    return sum + safeNumber(rental.totalCost);
  }, 0);

  const totalMaintenanceCost = (tool.maintenanceLogs || []).reduce(
    (sum, log) => {
      return sum + safeNumber(log.cost);
    },
    0
  );

  const purchasePrice = safeNumber(tool.purchasePrice);
  const depreciation = purchasePrice * 0.15;
  const remainingValue = purchasePrice - depreciation;

  const canBeRented =
    tool.canBeRented !== false &&
    tool.rentalRateDaily !== null &&
    tool.rentalRateDaily !== undefined &&
    safeNumber(tool.rentalRateDaily) > 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <ToolHeader
        tool={tool}
        canBeRented={canBeRented}
        onEdit={() => setIsEditDialogOpen(true)}
        onDelete={() => setIsDeleteConfirmOpen(true)}
        onAddMaintenance={() => setIsMaintenanceDialogOpen(true)}
        onAddInterUse={() => setIsInterUseDialogOpen(true)}
        onPrintReport={handlePrintReport}
        isPrinting={isPrinting}
      />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <ToolImageGallery
            tool={tool}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
          />
        </div>

        {/* Right: Stats */}
        <div className="space-y-4">
          <ToolStats
            tool={tool}
            canBeRented={canBeRented}
            totalRentalRevenue={totalRentalRevenue}
            totalMaintenanceCost={totalMaintenanceCost}
            purchasePrice={purchasePrice}
            depreciation={depreciation}
            remainingValue={remainingValue}
          />
        </div>
      </div>

      {/* Tabs */}
      <ToolTabs
        tool={tool}
        canBeRented={canBeRented}
        onAddMaintenance={() => setIsMaintenanceDialogOpen(true)}
        onAddInterUse={() => setIsInterUseDialogOpen(true)}
        loadTool={loadTool}
      />

      {/* Dialogs */}
      <MaintenanceDialog
        open={isMaintenanceDialogOpen}
        onOpenChange={setIsMaintenanceDialogOpen}
        tool={tool}
        onSubmit={onAddMaintenance}
      />

      <InterUseDialog
        open={isInterUseDialogOpen}
        onOpenChange={setIsInterUseDialogOpen}
        tool={tool}
        onSubmit={onAddInterUse}
      />

      <EditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        tool={tool}
        onSubmit={onUpdateTool}
      />
    </div>
  );
}
