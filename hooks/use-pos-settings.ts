import { useState, useEffect } from "react";

interface POSSettings {
  id: string;
  vatEnabled: boolean;
  vatRate: number;
  deliveryEnabled: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number;
  discountEnabled: boolean;
  maxDiscountRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
  printAutomatically: boolean;
  emailReceipt: boolean;
}

export function usePOSSettings() {
  const [settings, setSettings] = useState<POSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings/pos");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          throw new Error("Failed to fetch POS settings");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<POSSettings>) => {
    try {
      const response = await fetch("/api/settings/pos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        return updatedSettings;
      } else {
        throw new Error("Failed to update POS settings");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  return { settings, loading, error, updateSettings };
}
