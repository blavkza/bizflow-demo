// app/dashboard/shop/categories/DeleteConfirmationModal.tsx
"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: {
    id: string;
    name: string;
    _count: {
      products: number;
    };
  };
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  category,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Category
                </h2>
                <p className="text-gray-600 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Warning</p>
            <p className="text-red-700 mt-1">
              You are about to delete the category{" "}
              <strong>"{category.name}"</strong>.
            </p>
            {category._count.products > 0 && (
              <p className="text-red-700 mt-2">
                ⚠️ This category contains {category._count.products} product(s).
                You must remove all products before deleting this category.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={category._count.products > 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
