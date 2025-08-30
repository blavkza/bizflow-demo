import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  router: any;
}

export default function ErrorDisplay({ error, router }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Error</h2>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
