import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";

interface ProductHeaderProps {
  product: Product;
  onBack: () => void;
  onEdit: () => void;
}

export function ProductHeader({ product, onBack, onEdit }: ProductHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>
      <div>
        <h1 className="text-lg font-bold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground">SKU: {product.sku}</p>
      </div>
    </>
  );
}
