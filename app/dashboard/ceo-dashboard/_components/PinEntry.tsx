import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Router, Shield } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PinEntryProps {
  onSuccess: () => void;
}

const PinEntry = ({ onSuccess }: PinEntryProps) => {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Default PIN for demo - in production this would be properly secured
  const DEMO_PIN = "202520";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      if (pin === DEMO_PIN) {
        toast.success("Access granted");
        onSuccess();
      } else {
        toast.error("Invalid PIN. Try 1234 for demo.");
        setPin("");
      }
      setIsLoading(false);
    }, 800);
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers and max 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setPin(numericValue);
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-hover">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 " />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            CEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Enter your PIN to access the executive dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="pin"
              className="text-sm font-medium text-foreground"
            >
              Security PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="pin"
                type="password"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="pl-10 text-center text-lg tracking-widest"
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => router.back()}
            variant={"outline"}
            className="w-full hover:shadow-hover transition-all duration-200"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant={"outline"}
            className="w-full hover:shadow-hover transition-all duration-200"
            disabled={pin.length < 4 || isLoading}
          >
            {isLoading ? "Authenticating..." : "Access Dashboard"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PinEntry;
