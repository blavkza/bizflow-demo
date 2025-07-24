"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 my-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">
              Quotation Management
            </h1>
            <p className="text-muted-foreground">
              Create, track, and manage your quotations
            </p>
          </div>
        </div>
        <Button>
          <Link
            className="flex items-center gap-2"
            href={"/dashboard/quotations/new"}
          >
            {" "}
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Link>
        </Button>
      </div>
    </header>
  );
}
