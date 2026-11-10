"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  ChevronDown,
  Store,
  Bell,
  Search,
  Check
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Store Indicator */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            {getPageTitle(pathname)}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verified e-commerce intelligence
          </p>
        </div>

        {/* Store Selector Pill */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-xs font-medium text-slate-700 transition-colors"
          >
            <Store size={14} className="text-blue-600" />
            <span className="font-semibold text-slate-900">Aura Living Essentials</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
              Demo Store
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Active Store
                </p>
              </div>
              <div className="px-3 py-2 flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Aura Living Essentials</p>
                    <p className="text-[10px] text-slate-500">Shopify Demo Sync</p>
                  </div>
                </div>
                <Check size={14} className="text-blue-600" />
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors"
            >
              <Calendar size={14} className="text-slate-500" />
              <span>{dateOptions.find((d) => d.value === daysFilter)?.label || "Date Range"}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onDaysChange(opt.value);
                      setDateDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {daysFilter === opt.value && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Quick Shortcut */}
        <Link
          href="/assistant"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Ask AI Agent</span>
        </Link>
      </div>
    </header>
  );
};
