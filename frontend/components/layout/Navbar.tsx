"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  ChevronDown,
  Store,
  Check,
  Menu,
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { ApiClient } from "@/lib/api";
import { Logo } from "@/components/Logo";

interface NavbarProps {
  daysFilter?: number;
  onDaysChange?: (days: number) => void;
  onOpenMobileSidebar?: () => void;
  showMobileTitle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  daysFilter = 30,
  onDaysChange,
  onOpenMobileSidebar,
  showMobileTitle = false,
}) => {
  const pathname = usePathname();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [storeName, setStoreName] = useState("Active Store");
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiClient.getActiveStore().then((st: any) => {
      if (st?.name) setStoreName(st.name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStoreDropdownOpen(false);
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getPageTitle = (path: string): string => {
    switch (path) {
      case "/dashboard":
        return "Home";
      case "/sales":
        return "Sales";
      case "/products":
        return "Products";
      case "/customers":
        return "Customers";
      case "/forecasting":
        return "Forecast";
      case "/marketing":
        return "Marketing";
      case "/assistant":
        return "Assistant";
      case "/rewards":
        return "Rewards";
      case "/reports":
        return "Reports";
      case "/integrations":
        return "Integrations";
      case "/settings":
        return "Settings";
      default:
        return "Home";
    }
  };

  const dateOptions = [
    { label: "Last 7 Days", value: 7 },
    { label: "Last 30 Days", value: 30 },
    { label: "Last 90 Days", value: 90 },
  ];

  const mono: React.CSSProperties = {
    fontFamily: 'var(--font-plex-mono), ui-monospace, monospace',
  };

  return (
    <header className="h-16 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#14090b]/10 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
      {/* Page Title & Store Indicator */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-1 text-[#14090b] hover:text-[#7b1425] hover:bg-[#7b1425]/[0.06] rounded-lg md:hidden transition-colors flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Sellsy Logo */}
        <Link href="/" className="flex md:hidden items-center flex-shrink-0 mr-1" aria-label="Sellsy Home">
          <Logo size={26} />
        </Link>

        {showMobileTitle && (
          <div className="min-w-0 md:hidden">
            <h1 className="text-base font-semibold text-[#14090b] tracking-tight leading-none truncate">
              {getPageTitle(pathname)}
            </h1>
          </div>
        )}

        {/* Store Selector Pill */}
        <div ref={storeDropdownRef} className="relative hidden md:flex items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="h-9 inline-flex items-center gap-2 px-3 rounded-lg border border-[#14090b]/10 bg-white hover:bg-[#7b1425]/[0.04] text-xs font-medium text-[#14090b]/80 transition-colors"
          >
            <Store size={14} className="text-[#7b1425] flex-shrink-0" />
            <span className="font-semibold text-[#14090b] whitespace-nowrap">{storeName}</span>
            <span
              style={mono}
              className="px-1.5 py-0.5 bg-[#7b1425]/10 text-[#7b1425] text-[10px] font-medium rounded whitespace-nowrap"
            >
              Active
            </span>
            <ChevronDown size={14} className="text-[#6f6264] flex-shrink-0" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-white border border-[#14090b]/10 rounded-lg shadow-lg py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-[#14090b]/10">
                <p style={mono} className="text-[10px] font-medium text-[#6f6264] uppercase tracking-[0.14em]">
                  Active Store
                </p>
              </div>
              <div className="px-3 py-2 flex items-center justify-between bg-[#7b1425]/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#7b1425] text-white font-bold text-xs flex items-center justify-center">
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#14090b]">{storeName}</p>
                    <p className="text-[10px] text-[#6f6264]">Shopify Live Sync</p>
                  </div>
                </div>
                <Check size={14} className="text-[#7b1425]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Date Filter Dropdown */}
        {onDaysChange && (
          <div ref={dateDropdownRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="h-10 sm:h-9 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-full border border-[#7b1425]/40 bg-white hover:bg-[#7b1425]/[0.05] text-xs font-medium text-[#7b1425] transition-colors min-h-[40px]"
            >
              <Calendar size={14} className="flex-shrink-0" />
              <span className="whitespace-nowrap">{dateOptions.find((d) => d.value === daysFilter)?.label || "Date Range"}</span>
              <ChevronDown size={14} className="opacity-70 flex-shrink-0" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 max-w-[calc(100vw-2rem)] bg-white border border-[#14090b]/10 rounded-lg shadow-lg py-1 z-50">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onDaysChange(opt.value);
                      setDateDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#14090b]/80 hover:bg-[#7b1425]/[0.05] flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {daysFilter === opt.value && <Check size={14} className="text-[#7b1425]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Real-time Notifications */}
        <NotificationDropdown />

        {/* AI Assistant Quick Shortcut */}
        <Link
          href="/assistant"
          className="h-10 sm:h-9 inline-flex items-center gap-2 px-3 sm:px-4 rounded-full bg-[#14090b] hover:bg-[#7b1425] text-white text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px]"
        >
          <Sparkles size={14} className="flex-shrink-0" />
          <span className="hidden sm:inline">Ask AI</span>
        </Link>
      </div>
    </header>
  );
};