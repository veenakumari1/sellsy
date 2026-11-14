"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  daysFilter?: number;
  onDaysChange?: (days: number) => void;
  showMobileTitle?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  daysFilter,
  onDaysChange,
  showMobileTitle = false,
}) => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!ApiClient.isAuthenticated()) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard";
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7b1425] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[#faf8f5] text-[#14090b]" data-lenis-prevent>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden" data-lenis-prevent>
        <Navbar
          daysFilter={daysFilter}
          onDaysChange={onDaysChange}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          showMobileTitle={showMobileTitle}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

