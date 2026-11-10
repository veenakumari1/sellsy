"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  LineChart,
  Sparkles,
  BotMessageSquare,
  FileText,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sales Analytics", href: "/sales", icon: TrendingUp },
    { name: "Product Intelligence", href: "/products", icon: Package },
    { name: "Customer Insights", href: "/customers", icon: Users },
    { name: "Sales Forecasting", href: "/forecasting", icon: LineChart },
    { name: "AI Marketing Advisor", href: "/marketing", icon: Sparkles },
    { name: "Sellsy AI Assistant", href: "/assistant", icon: BotMessageSquare, highlight: true },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Integrations", href: "/integrations", icon: Plug },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    ApiClient.clearToken();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200 z-30 transition-all duration-200 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                Sellsy
              </span>
              <span className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider mt-0.5">
                Intelligence
              </span>
            </div>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                item.highlight && !isActive && "text-slate-800"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                size={20}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive
                    ? "text-blue-600"
                    : item.highlight
                    ? "text-blue-500 group-hover:text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {!collapsed && (
                <span className="truncate flex-1">{item.name}</span>
              )}
              {!collapsed && item.highlight && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Store Status Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                AM
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">Alex Mercer</p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <ShieldCheck size={12} />
                  <span className="truncate">Demo Store</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

