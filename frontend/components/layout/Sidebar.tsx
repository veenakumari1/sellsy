"use client";

import React from "react";
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/* Sellsy brand wordmark (landing page jaisa) */
function Wordmark({ size = 28, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
        fontStyle: "italic",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: "#14090b",
        display: "inline-block",
      }}
    >
      <span style={{ color: "#7b1425" }}>S</span>
      {!compact && (
        <>
          ell<span>s</span>
          <span style={{ color: "#7b1425" }}>y</span>
        </>
      )}
    </span>
  );
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
        "h-screen sticky top-0 flex flex-col bg-white border-r border-[#e8e2dc] z-30 transition-all duration-200 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#f3ede7]">
        <Link href="/" className="flex flex-col justify-center gap-1 overflow-hidden">
          {collapsed ? (
            <Wordmark size={30} compact />
          ) : (
            <>
              <Wordmark size={28} />
              <span
                className="text-[9px] uppercase tracking-[0.18em] text-[#7b1425] font-medium leading-none"
                style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
              >
                Intelligence
              </span>
            </>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-[#a89b99] hover:text-[#5a4e50] hover:bg-[#faf8f5] rounded-md transition-colors"
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
                  ? "bg-[#FBF1F3] text-[#620F1E] font-semibold"
                  : "text-[#5a4e50] hover:text-[#14090b] hover:bg-[#faf8f5]",
                item.highlight && !isActive && "text-[#2a1b1e]"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                size={20}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive
                    ? "text-[#7b1425]"
                    : item.highlight
                    ? "text-[#A3243A] group-hover:text-[#7b1425]"
                    : "text-[#a89b99] group-hover:text-[#5a4e50]"
                )}
              />
              {!collapsed && <span className="truncate flex-1">{item.name}</span>}
              {!collapsed && item.highlight && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-[#F6E1E5] text-[#620F1E] rounded-full"
                  style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
                >
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Store Status Footer */}
      <div className="p-3 border-t border-[#f3ede7] bg-[#faf8f5]/50">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e8e2dc]/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#7b1425] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                AM
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#14090b] truncate">Alex Mercer</p>
                <div className="flex items-center gap-1 text-[11px] text-[#7b1425]">
                  <ShieldCheck size={12} />
                  <span className="truncate">Demo Store</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#a89b99] hover:text-[#7b1425] hover:bg-[#FBF1F3] rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="p-2 text-[#a89b99] hover:text-[#7b1425] hover:bg-[#FBF1F3] rounded-md transition-colors"
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