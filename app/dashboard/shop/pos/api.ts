import { Product, SaleData } from "@/types/pos";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  return response.json();
}

export const productApi = {
  getAll: (params?: { search?: string; category?: string }) =>
    apiRequest<Product[]>(
      `/api/shop/products?${new URLSearchParams(params as any)}`
    ),

  getById: (id: string) => apiRequest<Product>(`/api/shop/products/${id}`),

  create: (data: any) =>
    apiRequest<Product>("/api/shop/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<Product>(`/api/shop/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/api/shop/products/${id}`, { method: "DELETE" }),
};

export const saleApi = {
  getAll: (params?: { startDate?: string; endDate?: string }) =>
    apiRequest<any[]>(`/api/shop/sales?${new URLSearchParams(params as any)}`),

  create: (data: SaleData) =>
    apiRequest<any>("/api/shop/sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
