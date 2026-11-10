"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  ChevronDown,
  Store,
  Check,
} from "lucide-react";

interface NavbarProps {
  daysFilter?: number;
  onDaysChange?: (days: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  daysFilter = 30,
  onDaysChange,
}) => {
  const pathname = usePathname();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const getPageTitle = (path: string): string => {
    switch (path) {
      case "/dashboard":
        return "Store Overview";
      case "/sales":
        return "Sales Analytics";
      case "/products":
        return "Product Intelligence";
      case "/customers":
        return "Customer Insights";
      case "/forecasting":
        return "Sales Forecasting";
      case "/marketing":
        return "AI Marketing Advisor";
      case "/assistant":
        return "Sellsy AI Assistant";
      case "/reports":
        return "Reports & Exports";
      case "/integrations":
        return "Integrations & Data";
      case "/settings":
        return "Store Settings";
      default:
        return "Dashboard";
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
    <header className="h-16 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#14090b]/10 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Store Indicator */}
      <div className="flex items-center gap-4">
        <div>
          {/* h1 ko globals.css se Fraunces mil jata hai */}
          <h1 className="text-lg font-semibold text-[#14090b] tracking-tight leading-none">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-xs text-[#6f6264] mt-0.5">
            Real-time verified e-commerce intelligence
          </p>
        </div>

        {/* Store Selector Pill */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#14090b]/10 bg-white hover:bg-[#7b1425]/[0.04] text-xs font-medium text-[#14090b]/80 transition-colors"
          >
            <Store size={14} className="text-[#7b1425]" />
            <span className="font-semibold text-[#14090b]">Aura Living Essentials</span>
            <span
              style={mono}
              className="px-1.5 py-0.5 bg-[#7b1425]/10 text-[#7b1425] text-[10px] font-medium rounded"
            >
              Demo Store
            </span>
            <ChevronDown size={14} className="text-[#6f6264]" />
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
                    A
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#14090b]">Aura Living Essentials</p>
                    <p className="text-[10px] text-[#6f6264]">Shopify Demo Sync</p>
                  </div>
                </div>
                <Check size={14} className="text-[#7b1425]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter Dropdown */}
        {onDaysChange && (
          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7b1425]/40 bg-white hover:bg-[#7b1425]/[0.05] text-xs font-medium text-[#7b1425] transition-colors"
            >
              <Calendar size={14} />
              <span>{dateOptions.find((d) => d.value === daysFilter)?.label || "Date Range"}</span>
              <ChevronDown size={14} className="opacity-70" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#14090b]/10 rounded-lg shadow-lg py-1 z-50">
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

        {/* AI Assistant Quick Shortcut */}
        <Link
          href="/assistant"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#14090b] hover:bg-[#7b1425] text-white text-xs font-semibold transition-colors"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Ask AI Agent</span>
        </Link>
      </div>
    </header>
  );
};