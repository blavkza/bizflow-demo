"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Product, ProductFormData } from "@/types/product";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (data: ProductFormData) => void;
  loading?: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSave,
  loading,
}: ProductModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {product ? "Update" : "Create"} a product for your e-commerce store.
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          product={product}
          onSubmit={onSave}
          onCancel={onClose}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
