"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Keyboard, QrCode, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setIsScanning(true);

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraAvailable(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsScanning(false);
      setCameraAvailable(false);

      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError(
            "Camera permission was denied. Please enable camera access in your browser settings or use manual entry."
          );
        } else if (err.name === "NotFoundError") {
          setError(
            "No camera found on this device. Please use manual entry instead."
          );
        } else if (err.name === "NotReadableError") {
          setError(
            "Camera is already in use by another application. Please close other apps and try again."
          );
        } else {
          setError(
            err.message ||
              "Unable to access camera. Please use manual entry instead."
          );
        }
      } else {
        setError("An unknown error occurred. Please use manual entry instead.");
      }

      // Automatically switch to manual mode if camera fails
      setScanMode("manual");
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setError(null);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim().toUpperCase());
      setManualBarcode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
  };

  // Simulate barcode scan for demo purposes
  const simulateScan = () => {
    const simulatedBarcode = `EMP${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
    onScan(simulatedBarcode);
    stopScanning();
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          variant={scanMode === "camera" ? "default" : "outline"}
          onClick={() => {
            setScanMode("camera");
            setError(null);
          }}
          className="flex-1"
          disabled={!cameraAvailable && scanMode !== "camera"}
        >
          <Camera className="mr-2 h-4 w-4" />
          Camera Scan
        </Button>
        <Button
          variant={scanMode === "manual" ? "default" : "outline"}
          onClick={() => {
            stopScanning();
            setScanMode("manual");
            setError(null);
          }}
          className="flex-1"
        >
          <Keyboard className="mr-2 h-4 w-4" />
          Manual Entry
        </Button>
      </div>

      {scanMode === "camera" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Scan Barcode
            </CardTitle>
            <CardDescription>
              Position the barcode within the camera view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isScanning ? (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-white rounded-lg animate-pulse"></div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                      Align barcode within the frame
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={simulateScan}
                      className="flex-1"
                      variant="secondary"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Simulate Scan (Demo)
                    </Button>
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      Stop Scanning
                    </Button>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Demo Mode</AlertTitle>
                    <AlertDescription>
                      In production, this would use a barcode scanning library
                      like @zxing/browser or html5-qrcode for real barcode
                      detection.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Scan</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Click the button below to activate your camera and scan
                    employee barcodes or QR codes
                  </p>
                  <Button onClick={startScanning}>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Having trouble? Try{" "}
                    <button
                      onClick={() => setScanMode("manual")}
                      className="text-primary underline hover:no-underline"
                    >
                      manual entry
                    </button>{" "}
                    instead
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Keyboard className="mr-2 h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Enter the employee ID or barcode number manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Employee ID / Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="e.g., EMP001"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the employee ID and press Enter or click Submit
                </p>
              </div>
              <Button
                onClick={handleManualSubmit}
                className="w-full"
                disabled={!manualBarcode.trim()}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Submit
              </Button>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Quick Examples:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["EMP001", "EMP002", "EMP003", "EMP004"].map((id) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualBarcode(id);
                      }}
                      className="justify-start"
                    >
                      {id}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
