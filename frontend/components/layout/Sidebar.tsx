"use client";

import React, { useState, useEffect } from "react";
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
  Trophy,
  X,
  BrainCircuit,
  UserCheck,
  Boxes,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/* Storsy brand wordmark (landing page jaisa) */
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
          tor<span>s</span>
          <span style={{ color: "#7b1425" }}>y</span>
        </>
      )}
    </span>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [storeName, setStoreName] = useState("Active Store");

  useEffect(() => {
    const u = ApiClient.getUser();
    if (u) setCurrentUser(u);
    ApiClient.getActiveStore().then((st: any) => {
      if (st?.name) setStoreName(st.name);
    }).catch(() => {});
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [mobileOpen]);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sales", href: "/sales", icon: TrendingUp },
    { name: "Products", href: "/products", icon: Package },
    { name: "Inventory Alerts", href: "/inventory", icon: Boxes, highlight: true },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Win-Back", href: "/winback", icon: UserCheck, highlight: true },
    { name: "Forecast", href: "/forecasting", icon: LineChart },
    { name: "Marketing", href: "/marketing", icon: Sparkles },
    { name: "AI Content", href: "/content", icon: Wand2, highlight: true },
    { name: "Assistant", href: "/assistant", icon: BotMessageSquare, highlight: true },
    { name: "AI Team", href: "/agents", icon: BrainCircuit, highlight: true },
    { name: "Rewards", href: "/rewards", icon: Trophy },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Integrations", href: "/integrations", icon: Plug },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    ApiClient.clearToken();
    router.push("/login");
  };

  const prefetchPage = (href: string) => {
    switch (href) {
      case "/dashboard":
        ApiClient.prefetch("/api/v1/analytics/overview");
        break;
      case "/sales":
        ApiClient.prefetch("/api/v1/analytics/trends?days=30");
        ApiClient.prefetch("/api/v1/analytics/kpis?days=30");
        break;
      case "/products":
        ApiClient.prefetch("/api/v1/products?sort_by=revenue");
        break;
      case "/inventory":
        ApiClient.prefetch("/api/v1/inventory/alerts");
        break;
      case "/customers":
        ApiClient.prefetch("/api/v1/customers/insights");
        ApiClient.prefetch("/api/v1/customers");
        break;
      case "/winback":
        ApiClient.prefetch("/api/v1/winback/at-risk?days=30");
        break;
      case "/forecasting":
        ApiClient.prefetch("/api/v1/forecasts?days_ahead=30");
        break;
      case "/marketing":
        ApiClient.prefetch("/api/v1/marketing/strategy");
        break;
      case "/content":
        ApiClient.prefetch("/api/v1/products?limit=50");
        break;
      case "/assistant":
        ApiClient.prefetch("/api/v1/assistant/conversations");
        break;
      case "/agents":
        ApiClient.prefetch("/api/v1/agents/history");
        break;
      case "/rewards":
        ApiClient.prefetch("/api/v1/gamification/overview");
        ApiClient.prefetch("/api/v1/gamification/leaderboard");
        break;
      case "/reports":
        ApiClient.prefetch("/api/v1/reports");
        break;
      case "/integrations":
        ApiClient.prefetch("/api/v1/integrations/status");
        break;
    }
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside
        className={cn(
          "hidden md:flex h-full flex-col bg-white border-r border-[#e8e2dc] z-30 transition-all duration-200 select-none flex-shrink-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#f3ede7] flex-shrink-0">
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
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => prefetchPage(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#FBF1F3] text-[#620F1E] font-semibold"
                    : "text-[#5a4e50] hover:text-[#14090b] hover:bg-[#faf8f5]",
                  item.highlight && !isActive && "text-[#2a1b1e]",
                  collapsed && "justify-center px-0 gap-0"
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
        <div className="p-3 border-t border-[#f3ede7] bg-[#faf8f5]/50 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e8e2dc]/60">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <div className="w-8 h-8 rounded-full bg-[#7b1425] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                  {(currentUser?.full_name || currentUser?.email || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#14090b] truncate">
                    {currentUser?.full_name || currentUser?.email || "Workspace User"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-[#7b1425]">
                    <ShieldCheck size={12} className="flex-shrink-0" />
                    <span className="truncate">{storeName}</span>
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

      {/* Mobile Drawer Backdrop (below md only) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Mobile Slide-in Drawer (below md only) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full h-dvh bg-white z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out select-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Drawer Header with Logo and Close 'X' Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#f3ede7] flex-shrink-0">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex flex-col justify-center gap-1 overflow-hidden"
          >
            <Wordmark size={28} />
            <span
              className="text-[9px] uppercase tracking-[0.18em] text-[#7b1425] font-medium leading-none"
              style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
            >
              Intelligence
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 text-[#a89b99] hover:text-[#14090b] hover:bg-[#faf8f5] rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation List */}
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group min-h-[42px]",
                  isActive
                    ? "bg-[#FBF1F3] text-[#620F1E] font-semibold"
                    : "text-[#5a4e50] hover:text-[#14090b] hover:bg-[#faf8f5]",
                  item.highlight && !isActive && "text-[#2a1b1e]"
                )}
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
                <span className="truncate flex-1">{item.name}</span>
                {item.highlight && (
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

        {/* Mobile User & Store Status Footer */}
        <div className="p-3 border-t border-[#f3ede7] bg-[#faf8f5]/50 flex-shrink-0">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e8e2dc]/60">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <div className="w-8 h-8 rounded-full bg-[#7b1425] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                {(currentUser?.full_name || currentUser?.email || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#14090b] truncate">
                  {currentUser?.full_name || currentUser?.email || "Workspace User"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#7b1425]">
                  <ShieldCheck size={12} className="flex-shrink-0" />
                  <span className="truncate">{storeName}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onCloseMobile?.();
                handleLogout();
              }}
              className="p-2 text-[#a89b99] hover:text-[#7b1425] hover:bg-[#FBF1F3] rounded-md transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};