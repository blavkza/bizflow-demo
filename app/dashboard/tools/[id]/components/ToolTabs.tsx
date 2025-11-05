import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tool } from "@/types/tool";
import { InterUseHistory } from "./InterUseHistory";
import { RentalHistory } from "./RentalHistory";
import { MaintenanceHistory } from "./MaintenanceHistory";
import { ToolDetails } from "./ToolDetails";

interface ToolTabsProps {
  tool: Tool;
  canBeRented: boolean;
  onAddMaintenance: () => void;
  onAddInterUse: () => void;
  loadTool: () => void;
}

export function ToolTabs({
  tool,
  canBeRented,
  onAddMaintenance,
  onAddInterUse,
  loadTool,
}: ToolTabsProps) {
  return (
    <Tabs defaultValue="interuse" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="interuse">Internal Use</TabsTrigger>
        <TabsTrigger value="rentals">Rental History</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="interuse">
        <InterUseHistory
          tool={tool}
          onAddInterUse={onAddInterUse}
          onUpdateTool={loadTool}
        />
      </TabsContent>

      <TabsContent value="rentals">
        <RentalHistory tool={tool} canBeRented={canBeRented} />
      </TabsContent>

      <TabsContent value="maintenance">
        <MaintenanceHistory tool={tool} onAddMaintenance={onAddMaintenance} />
      </TabsContent>

      <TabsContent value="details">
        <ToolDetails tool={tool} />
      </TabsContent>
    </Tabs>
  );
}
