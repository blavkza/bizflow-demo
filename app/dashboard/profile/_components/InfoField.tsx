"use client";

export function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
