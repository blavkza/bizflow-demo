"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { usePOSSettings } from "@/hooks/use-pos-settings";
import { Product, CartItem, SaleData } from "@/types/pos";
import { productApi, saleApi } from "./api";
import { POSHeader } from "./components/pos-header";
import { ProductGrid } from "./components/product-grid";
import { CartSection } from "./components/cart-section";
import { ReceiptDialog } from "./components/receipt-dialog";
import { PaymentMethod } from "@prisma/client";
import { CheckoutDialog } from "./components/checkout-dialog";
import { QuotationDialog } from "./components/quotation-dialog";
import { SearchQuotationDialog } from "./components/search-quotation-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Search, Edit, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuotationReceiptDialog } from "./components/quotation-receipt-dialog";

export default function POSPage() {
  const { toast } = useToast();
  const { companyInfo } = useCompanyInfo();
  const { settings: posSettings } = usePOSSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [receiptSize, setReceiptSize] = useState<"thermal" | "A4">("thermal");
  const [receiptEmail, setReceiptEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [amountReceived, setAmountReceived] = useState("");
  const [discount, setDiscount] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [change, setChange] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [scanNotice, setScanNotice] = useState<{
    message: string;
    type: "error" | "warning" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Quotation states
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [isSearchQuotationDialogOpen, setIsSearchQuotationDialogOpen] =
    useState(false);
  const [activeQuotation, setActiveQuotation] = useState<any>(null);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [isUpdatingQuotation, setIsUpdatingQuotation] = useState(false);
  const [isQuotationReceiptDialogOpen, setIsQuotationReceiptDialogOpen] =
    useState(false);
  const [completedQuotation, setCompletedQuotation] = useState<any>(null);
  const [quotationReceiptSize, setQuotationReceiptSize] = useState<
    "A4" | "thermal"
  >("thermal");
  const [quotationReceiptEmail, setQuotationReceiptEmail] = useState("");

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // Check if product status is not ACTIVE
    if (product.status !== "ACTIVE") {
      showScanNotice(`${product.name} is not available for sale`, "error");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      // Check if we exceed stock for warning only
      if (existingItem.quantity >= product.stock) {
        showScanNotice(
          `Only ${product.stock} units available of ${product.name}. You can still add more, but this exceeds current stock.`,
          "warning"
        );
      }

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

      if (product.stock > 0) {
        showScanNotice(`Added ${product.name} to cart`, "info");
      } else {
        showScanNotice(
          `Added ${product.name} to cart (Out of stock)`,
          "warning"
        );
      }
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price) || 0,
          quantity: 1,
          image: product.images?.[0],
          stock: product.stock,
        },
      ]);

      if (product.stock > 0) {
        showScanNotice(`Added ${product.name} to cart`, "info");
      } else {
        showScanNotice(
          `Added ${product.name} to cart (Out of stock)`,
          "warning"
        );
      }
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const product = products.find((p) => p.id === id);

    // Check if product is still active
    if (product && product.status !== "ACTIVE") {
      showScanNotice(
        `${product.name} is no longer available for sale`,
        "error"
      );
      removeFromCart(id);
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      // Check stock only for warning
      if (product && newQuantity > product.stock) {
        showScanNotice(
          `Only ${product.stock} units available. You can still proceed, but this exceeds current stock.`,
          "warning"
        );
      }

      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setDeliveryInstructions("");
    setIsDelivery(false);
    setChange(undefined);
    setPaymentMethod(PaymentMethod.CASH);
    setAmountReceived("");
    setActiveQuotation(null);
  };

  const showScanNotice = (
    message: string,
    type: "error" | "warning" | "info"
  ) => {
    setScanNotice({
      message,
      type,
      visible: true,
    });

    setTimeout(() => {
      setScanNotice((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Calculate totals with VAT and delivery
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );

  // Apply discount limits from POS settings
  const maxDiscount = posSettings?.maxDiscountRate || 100;
  const actualDiscount = Math.min(discount, maxDiscount);
  const discountAmount = (subtotal * actualDiscount) / 100;

  // Calculate VAT if enabled
  const vatRate = posSettings?.vatEnabled ? posSettings?.vatRate || 0.15 : 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * vatRate;

  // Calculate delivery fee
  const freeDeliveryThreshold = posSettings?.freeDeliveryAbove || 500;
  const baseDeliveryFee = posSettings?.deliveryFee || 50;
  const deliveryAmount =
    isDelivery && posSettings?.deliveryEnabled
      ? subtotal >= freeDeliveryThreshold
        ? 0
        : baseDeliveryFee
      : 0;

  const total = subtotal - discountAmount + tax + deliveryAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    // Check for inactive products in cart
    const inactiveProducts = cart.filter((item) => {
      const product = products.find((p) => p.id === item.id);
      return product && product.status !== "ACTIVE";
    });

    if (inactiveProducts.length > 0) {
      toast({
        title: "Inactive Products",
        description:
          "Some products in your cart are no longer active and will be removed",
        variant: "destructive",
      });

      // Remove inactive products
      setCart(
        cart.filter((item) => {
          const product = products.find((p) => p.id === item.id);
          return product && product.status === "ACTIVE";
        })
      );

      return;
    }

    setIsCheckoutOpen(true);
  };

  const handleManualBarcodeSearch = () => {
    if (barcodeInput.trim()) {
      const product = products.find(
        (p) => p.sku === barcodeInput.trim().toUpperCase()
      );

      if (product) {
        if (product.status !== "ACTIVE") {
          showScanNotice(`${product.name} is not available for sale`, "error");
        } else {
          addToCart(product);
          setBarcodeInput("");
        }
      } else {
        showScanNotice("Product not found", "error");
      }
    }
  };

  // Function to create quotation
  const createQuotation = async (quotationData: any) => {
    setIsCreatingQuotation(true);

    try {
      const response = await fetch("/api/shop/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create quotation");
      }

      const quotation = await response.json();

      toast({
        title: "Quotation Created",
        description: `Quotation ${quotation.quoteNumber} created successfully`,
      });

      // Set completed quotation and open receipt dialog
      setCompletedQuotation(quotation);
      setIsQuotationDialogOpen(false);
      setIsQuotationReceiptDialogOpen(true);

      return quotation;
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const handleFinishQuotation = () => {
    clearCart();
    setIsQuotationReceiptDialogOpen(false);
    setCompletedQuotation(null);
    setQuotationReceiptEmail("");
    setQuotationReceiptSize("A4");
  };

  // Function to update quotation
  const updateQuotation = async (quotationData: any) => {
    setIsUpdatingQuotation(true);

    try {
      const response = await fetch(`/api/shop/quotations/${quotationData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update quotation");
      }

      const quotation = await response.json();

      toast({
        title: "Quotation Updated",
        description: `Quotation ${quotation.quoteNumber} updated successfully`,
      });

      setIsQuotationDialogOpen(false);

      return quotation;
    } catch (error: any) {
      console.error("Error updating quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdatingQuotation(false);
    }
  };

  // Function to load quotation into cart
  const loadQuotation = (quotation: any) => {
    setActiveQuotation(quotation);

    // Add items to cart
    const cartItems: CartItem[] = quotation.items.map((item: any) => ({
      id: item.shopProduct.id,
      name: item.shopProduct.name,
      sku: item.shopProduct.sku,
      price: Number(item.price) || 0,
      quantity: item.quantity,
      image: item.shopProduct.images?.[0],
      stock: item.shopProduct.stock,
    }));

    setCart(cartItems);

    // Set customer info
    setCustomerName(quotation.customerName || "");
    setCustomerPhone(quotation.customerPhone || "");
    setCustomerEmail(quotation.customerEmail || "");
    setCustomerAddress(quotation.customerAddress || "");
    setIsDelivery(quotation.isDelivery || false);
    setDeliveryInstructions(quotation.deliveryInstructions || "");
    setDiscount(quotation.discountPercent || 0);

    toast({
      title: "Quotation Loaded",
      description: `Quotation ${quotation.quoteNumber} loaded successfully`,
    });
  };

  // Function to edit quotation
  const editQuotation = (quotation: any) => {
    // Load quotation into cart and open edit dialog
    loadQuotation(quotation);
    setIsQuotationDialogOpen(true);
  };

  // Function to convert quotation to sale
  const convertQuotationToSale = (quotation: any) => {
    loadQuotation(quotation);
    setIsCheckoutOpen(true);
  };

  // Function to open quotation dialog from cart
  const openQuotationDialog = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add items to cart before creating quotation",
        variant: "destructive",
      });
      return;
    }
    setIsQuotationDialogOpen(true);
  };

  const completeTransaction = async () => {
    setIsProcessing(true);

    try {
      // If we have an active quotation, use the conversion endpoint
      if (activeQuotation) {
        const received = Number.parseFloat(amountReceived) || 0;

        // Validate cash payment
        if (paymentMethod === PaymentMethod.CASH && received < total) {
          toast({
            title: "Insufficient Amount",
            description: `Amount received (R${received.toFixed(2)}) is less than total (R${total.toFixed(2)})`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Validate delivery address if delivery is enabled
        if (isDelivery && (!customerAddress || customerAddress.trim() === "")) {
          toast({
            title: "Delivery Address Required",
            description: "Please enter a delivery address for delivery orders",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const response = await fetch(
          `/api/shop/quotations/${activeQuotation.id}/convert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentMethod,
              amountReceived:
                paymentMethod === PaymentMethod.CASH ? received : undefined,
              change:
                paymentMethod === PaymentMethod.CASH
                  ? received - total
                  : undefined,
              isDelivery,
              deliveryAddress: customerAddress,
              deliveryInstructions,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to convert quotation");
        }

        const sale = await response.json();

        setCompletedSale({
          ...sale,
          company: companyInfo
            ? {
                name: companyInfo.companyName,
                address: `${companyInfo.address}, ${companyInfo.city}, ${companyInfo.province}, ${companyInfo.postCode}`,
                phone: companyInfo.phone,
                email: companyInfo.email,
                taxNumber: companyInfo.taxId,
              }
            : {
                name: "FinanceFlow Solutions",
                address: "456 Corporate Ave, Sandton, 2196, South Africa",
                phone: "+27 11 987 6543",
                email: "sales@financeflow.co.za",
                taxNumber: "9876543210",
              },
        });

        setReceiptEmail(customerEmail);
        setIsCheckoutOpen(false);
        setIsReceiptDialogOpen(true);

        // Show appropriate message based on sale status
        if (sale.status === "AWAITING_STOCK") {
          toast({
            title: "Sale Created - Awaiting Stock",
            description: `Sale ${sale.saleNumber} created with stock shortages`,
            variant: "default",
            className: "bg-yellow-50 text-yellow-900 border-yellow-200",
          });
        } else {
          toast({
            title: "Transaction Complete",
            description: `Sale ${sale.saleNumber} completed successfully${isDelivery ? " with delivery order" : ""}`,
          });
        }

        // Check for warnings in the response
        if (sale.warnings && sale.warnings.negativeStock) {
          sale.warnings.negativeStock.forEach((warning: any) => {
            toast({
              title: "Stock Warning",
              description: warning.message,
              variant: "default",
              className: "bg-yellow-50 text-yellow-900 border-yellow-200",
            });
          });
        }

        // Clear cart after successful transaction
        clearCart();
      } else {
        // Original sale creation logic for non-quotation sales
        const received = Number.parseFloat(amountReceived) || 0;

        // Validate cash payment
        if (paymentMethod === PaymentMethod.CASH && received < total) {
          toast({
            title: "Insufficient Amount",
            description: `Amount received (R${received.toFixed(2)}) is less than total (R${total.toFixed(2)})`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Validate delivery address if delivery is enabled
        if (isDelivery && (!customerAddress || customerAddress.trim() === "")) {
          toast({
            title: "Delivery Address Required",
            description: "Please enter a delivery address for delivery orders",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const saleData: SaleData = {
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          customerAddress: isDelivery ? customerAddress : undefined,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: Number(item.price) || 0,
            total: (Number(item.price) || 0) * item.quantity,
          })),
          subtotal,
          discount: discountAmount,
          discountPercent: actualDiscount,
          tax,
          deliveryAmount,
          total,
          paymentMethod,
          amountReceived:
            paymentMethod === PaymentMethod.CASH ? received : undefined,
          change:
            paymentMethod === PaymentMethod.CASH ? received - total : undefined,
          isDelivery,
          deliveryAddress: isDelivery ? customerAddress : undefined,
          deliveryInstructions: isDelivery ? deliveryInstructions : undefined,
        };

        console.log("Submitting sale data:", JSON.stringify(saleData, null, 2));

        const sale = await saleApi.create(saleData);

        console.log("Sale created:", sale);

        setCompletedSale({
          ...sale,
          company: companyInfo
            ? {
                name: companyInfo.companyName,
                address: `${companyInfo.address}, ${companyInfo.city}, ${companyInfo.province}, ${companyInfo.postCode}`,
                phone: companyInfo.phone,
                email: companyInfo.email,
                taxNumber: companyInfo.taxId,
              }
            : {
                name: "FinanceFlow Solutions",
                address: "456 Corporate Ave, Sandton, 2196, South Africa",
                phone: "+27 11 987 6543",
                email: "sales@financeflow.co.za",
                taxNumber: "9876543210",
              },
        });

        setReceiptEmail(customerEmail);
        setIsCheckoutOpen(false);
        setIsReceiptDialogOpen(true);

        toast({
          title: "Transaction Complete",
          description: `Sale ${sale.saleNumber} completed successfully${isDelivery ? " with delivery order" : ""}`,
        });

        // Check for warnings in the response
        if (sale.warnings && sale.warnings.negativeStock) {
          sale.warnings.negativeStock.forEach((warning: any) => {
            toast({
              title: "Stock Warning",
              description: warning.message,
              variant: "default",
              className: "bg-yellow-50 text-yellow-900 border-yellow-200",
            });
          });
        }

        // Clear cart after successful transaction
        clearCart();
      }
    } catch (error: any) {
      console.error("Error completing sale:", error);

      let errorMessage = "Could not complete the sale";
      if (error.message?.includes("inactive products")) {
        errorMessage = "Cannot process sale with inactive products";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Re-fetch products to get updated stock status
      await fetchProducts();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishSale = () => {
    clearCart();
    setIsReceiptDialogOpen(false);
    setCompletedSale(null);
    setAmountReceived("");
    setPaymentMethod(PaymentMethod.CASH);
    setReceiptSize("thermal");
    setReceiptEmail("");
    fetchProducts();
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      {/* Active Quotation Banner */}
      {activeQuotation && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-700">
                  Active Quotation: {activeQuotation.quoteNumber}
                </div>
                <div className="text-sm text-blue-600">
                  {activeQuotation.customerName || "No customer name"} • R
                  {activeQuotation.total.toFixed(2)} •
                  {activeQuotation.expiryDate
                    ? ` Expires: ${new Date(activeQuotation.expiryDate).toLocaleDateString()}`
                    : " No expiry"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => editQuotation(activeQuotation)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveQuotation(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      <POSHeader
        cart={cart}
        scanNotice={scanNotice}
        activeQuotation={activeQuotation}
      />

      {/* Search Quotation Button */}
      <div className="mb-4">
        <Button
          onClick={() => setIsSearchQuotationDialogOpen(true)}
          variant="secondary"
          className="w-full"
        >
          <Search className="mr-2 h-4 w-4" />
          Search Quotations
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProductGrid
          products={filteredProducts}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          handleBarcodeSearch={handleManualBarcodeSearch}
          addToCart={addToCart}
          showScanNotice={showScanNotice}
        />

        <CartSection
          cart={cart}
          discount={discount}
          setDiscount={setDiscount}
          maxDiscount={maxDiscount}
          subtotal={subtotal}
          discountAmount={discountAmount}
          tax={tax}
          deliveryAmount={deliveryAmount}
          total={total}
          isDelivery={isDelivery}
          posSettings={posSettings}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          handleCheckout={handleCheckout}
          onCreateQuotation={openQuotationDialog}
          products={products}
        />
      </div>

      {/* Quotation Dialog */}
      <QuotationDialog
        isOpen={isQuotationDialogOpen}
        onOpenChange={setIsQuotationDialogOpen}
        cart={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountPercent={actualDiscount}
        tax={tax}
        deliveryAmount={deliveryAmount}
        total={total}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        isDelivery={isDelivery}
        setIsDelivery={setIsDelivery}
        deliveryInstructions={deliveryInstructions}
        setDeliveryInstructions={setDeliveryInstructions}
        onCreateQuotation={createQuotation}
        onUpdateQuotation={updateQuotation}
        isLoading={isCreatingQuotation || isUpdatingQuotation}
        isEditing={!!activeQuotation}
        quotation={activeQuotation}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        discount={discount}
        setDiscount={setDiscount}
        onClose={() => {
          // Optionally clear cart after creating quotation
          if (!isCreatingQuotation && !activeQuotation) {
            clearCart();
          }
        }}
      />

      {/* Search Quotation Dialog */}
      <SearchQuotationDialog
        isOpen={isSearchQuotationDialogOpen}
        onOpenChange={setIsSearchQuotationDialogOpen}
        onLoadQuotation={loadQuotation}
        onEditQuotation={editQuotation}
        onConvertToSale={convertQuotationToSale}
      />

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountPercent={actualDiscount}
        tax={tax}
        deliveryAmount={deliveryAmount}
        total={total}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        change={change}
        setChange={setChange}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        deliveryInstructions={deliveryInstructions}
        setDeliveryInstructions={setDeliveryInstructions}
        isDelivery={isDelivery}
        setIsDelivery={setIsDelivery}
        completeTransaction={completeTransaction}
        posSettings={posSettings}
        title={
          activeQuotation
            ? `Convert Quotation ${activeQuotation.quoteNumber}`
            : "Complete Transaction"
        }
      />

      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        completedSale={completedSale}
        receiptSize={receiptSize}
        setReceiptSize={setReceiptSize}
        receiptEmail={receiptEmail}
        setReceiptEmail={setReceiptEmail}
        isSendingEmail={isSendingEmail}
        setIsSendingEmail={setIsSendingEmail}
        handleFinishSale={handleFinishSale}
      />

      <QuotationReceiptDialog
        isOpen={isQuotationReceiptDialogOpen}
        onOpenChange={setIsQuotationReceiptDialogOpen}
        completedQuotation={completedQuotation}
        receiptSize={quotationReceiptSize}
        setReceiptSize={setQuotationReceiptSize}
        receiptEmail={quotationReceiptEmail}
        setReceiptEmail={setQuotationReceiptEmail}
        isSendingEmail={isSendingEmail}
        setIsSendingEmail={setIsSendingEmail}
        handleFinishQuotation={handleFinishQuotation}
      />
    </div>
  );
}
