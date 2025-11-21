"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, QrCode, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Scanner } from "@yudiel/react-qr-scanner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      setIsScanning(false);
    };
  }, []);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      if (code) {
        onScan(code);
        setIsScanning(false);
      }
    }
  };

  const handleError = (err: any) => {
    console.error("Scanner Error:", err);
    setError(
      err?.message ||
        "Failed to access camera. Please ensure permissions are granted."
    );
    setIsScanning(false);
  };

  const startScanning = () => {
    setError(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  // Fix for "Type 'boolean' is not assignable to type 'TrackFunction'"
  const disableTracker = () => {};

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Scanner Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5" />
            Scan Barcode
          </CardTitle>
          <CardDescription>
            Position the employee QR code within the frame
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isScanning ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    components={{
                      torch: false,
                      onOff: false,
                      tracker: disableTracker, // Fix TS error
                    }}
                    styles={{
                      container: {
                        width: "100%",
                        height: "100%",
                        borderRadius: "0.5rem",
                      },
                      video: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      },
                    }}
                  />
                  {/* Visual Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white/70 rounded-lg"></div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
                    Scanning...
                  </div>
                </div>

                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="w-full"
                >
                  Stop Camera
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to Scan</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Click the button below to activate your camera.
                </p>
                <Button onClick={startScanning}>
                  <Camera className="mr-2 h-4 w-4" />
                  Activate Camera
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
