"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingProvider } from "@/lib/branding";

// Dynamically import Toaster with SSR disabled to prevent hydration/portal issues
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((mod) => mod.Toaster),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <BrandingProvider>
          <TooltipProvider delayDuration={0}>
            {children}
            {mounted && <Toaster richColors position="top-right" />}
          </TooltipProvider>
        </BrandingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
