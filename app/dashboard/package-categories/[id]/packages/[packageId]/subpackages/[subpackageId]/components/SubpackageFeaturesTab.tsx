"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Subpackage } from "../../../types";

interface SubpackageFeaturesTabProps {
  subpackage: Subpackage;
}

export default function SubpackageFeaturesTab({
  subpackage,
}: SubpackageFeaturesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>Features included in this subpackage</CardDescription>
      </CardHeader>
      <CardContent>
        {subpackage.features?.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No features defined</h3>
            <p className="text-sm text-muted-foreground">
              Add features to this subpackage to highlight its benefits
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {subpackage.features?.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
