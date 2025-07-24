"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullInvoice } from "@/types/invoice";

interface NoteTermsCardProps {
  notes?: string | null;
  terms?: string | null;
}

export default function NoteTermsCard({ notes, terms }: NoteTermsCardProps) {
  if (!notes && !terms) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Terms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
        {terms && (
          <div>
            <h4 className="text-sm font-medium mb-2">Terms</h4>
            <p className="text-sm text-muted-foreground">{terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
