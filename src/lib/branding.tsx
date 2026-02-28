"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface BrandingSettings {
  name: string;
  logo: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  name: "Sentinel",
  logo: null,
  isLoading: true,
  refresh: async () => {},
};

const BrandingContext = createContext<BrandingSettings>(defaultBranding);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Omit<BrandingSettings, "refresh">>({
    name: "Sentinel",
    logo: null,
    isLoading: true,
  });

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch("/api/branding", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          name: data.name || "Sentinel",
          logo: data.logo || null,
          isLoading: false,
        });
        
        // Update favicon if logo exists
        if (data.logo) {
          updateFavicon(data.logo);
        }
      } else {
        setBranding((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setBranding((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const value: BrandingSettings = {
    ...branding,
    refresh: fetchBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

function updateFavicon(logoDataUrl: string) {
  // Use requestIdleCallback or setTimeout to avoid React reconciliation conflicts
  const update = () => {
    try {
      // Remove existing favicon links safely
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });

      // Add new favicon
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = logoDataUrl;
      document.head.appendChild(link);
    } catch {
      // Silently fail if DOM manipulation fails
    }
  };

  // Defer to avoid conflicts with React's render cycle
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(update);
  } else {
    setTimeout(update, 0);
  }
}
