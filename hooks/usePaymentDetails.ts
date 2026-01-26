import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PaymentDetail } from "@/app/dashboard/payments/[id]/types";

export const usePaymentDetails = (paymentId?: string) => {
  const params = useParams();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const id = paymentId || (params.id as string);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payroll/payments/${id}`);
        if (!response.ok) throw new Error("Failed to fetch payment");
        const data = await response.json();
        setPayment(data);
      } catch (error) {
        console.error("Error fetching payment:", error);
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id]);

  return { payment, loading };
};
