"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarTrigger() {
  const { toggleSidebar, state, isMobile } = useSidebar();

  if (isMobile) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSidebar}
      aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
      className={cn(
        "fixed z-50 h-6 w-6 rounded-full border bg-background shadow-md transition-all duration-200 hover:bg-accent",
        "top-[calc(3.5rem/2)] -translate-y-1/2",
        state === "expanded" ? "left-[calc(var(--sidebar-width)-0.75rem)]" : "left-[calc(var(--sidebar-width-icon)-0.75rem)]"
      )}
    >
      {state === "expanded" ? (
        <ChevronLeft className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </Button>
  );
}
