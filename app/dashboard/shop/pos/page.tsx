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

  // Fix: Explicitly type the state as PaymentMethod to allow all enum values
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
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
      }
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          quantity: 1,
          image: product.images?.[0],
          stock: product.stock,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const product = products.find((p) => p.id === id);
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else if (product && newQuantity <= product.stock) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      toast({
        title: "Stock Limit Reached",
        description: `Only ${product?.stock} units available`,
        variant: "destructive",
      });
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
    setPaymentMethod(PaymentMethod.CASH); // Reset to default
  };

  // Calculate totals with VAT and delivery
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
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
    setIsCheckoutOpen(true);
  };

  const handleBarcodeSearch = () => {
    const product = products.find((p) => p.sku === barcodeInput.toUpperCase());
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    }
  };

  const completeTransaction = async () => {
    const received = Number.parseFloat(amountReceived) || 0;
    if (paymentMethod === PaymentMethod.CASH && received < total) {
      toast({
        title: "Insufficient Amount",
        description: "Amount received is less than total",
        variant: "destructive",
      });
      return;
    }

    try {
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
          price: item.price,
          total: item.price * item.quantity,
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

      const sale = await saleApi.create(saleData);

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
    } catch (error) {
      console.error("Error completing sale:", error);
      toast({
        title: "Transaction Failed",
        description: "Could not complete the sale",
        variant: "destructive",
      });
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
      <POSHeader cart={cart} />

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
          handleBarcodeSearch={handleBarcodeSearch}
          addToCart={addToCart}
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
        />
      </div>

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
    </div>
  );
}
