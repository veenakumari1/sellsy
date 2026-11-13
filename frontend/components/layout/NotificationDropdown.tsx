"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  Award,
  TrendingUp,
  X,
  ExternalLink
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { realtimeClient } from "@/lib/realtime";

export const NotificationDropdown: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await ApiClient.listNotifications(20);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to live WebSocket notifications
    if (realtimeClient) {
      const unsubscribe = realtimeClient.subscribe((event) => {
        if (event.type === "NOTIFICATION") {
          const newNotif = event.data;
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setUnreadCount((c) => c + 1);
        } else if (event.type === "METRIC_UPDATE") {
          loadNotifications();
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      try {
        await ApiClient.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }
    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order":
        return <ShoppingBag size={14} className="text-emerald-700" />;
      case "inventory_alert":
        return <AlertTriangle size={14} className="text-amber-700" />;
      case "ai_insight":
        return <Sparkles size={14} className="text-purple-700" />;
      case "gamification":
        return <Award size={14} className="text-[#7b1425]" />;
      default:
        return <TrendingUp size={14} className="text-[#14090b]" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      const diffSec = Math.floor((Date.now() - dt.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full border border-[#14090b]/10 bg-white hover:bg-[#7b1425]/[0.05] text-[#14090b]/80 transition-colors flex-shrink-0"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7b1425] text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white border border-[#14090b]/10 rounded-xl shadow-xl z-50 overflow-hidden text-[#14090b]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#f3ede7] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#14090b] tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#7b1425]/10 text-[#7b1425] text-[10px] font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-[#7b1425] hover:underline flex items-center gap-1"
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f3ede7]">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !n.is_read
                      ? "bg-[#FBF1F3]/50 hover:bg-[#FBF1F3]"
                      : "hover:bg-[#faf8f5]"
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-white border border-[#e8e2dc]/80 shadow-2xs mt-0.5">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${!n.is_read ? "font-bold text-[#14090b]" : "font-medium text-[#3b2f31]"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#a89b99] whitespace-nowrap">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6f6264] line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#7b1425] flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#a89b99]">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer with Live status */}
          <div className="px-4 py-2 border-t border-[#f3ede7] bg-[#faf8f5] flex items-center justify-between text-[10px] text-[#6f6264]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Live Connected</span>
            </div>
            <Link
              href="/rewards"
              onClick={() => setOpen(false)}
              className="font-medium text-[#7b1425] hover:underline"
            >
              Rewards Hub →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

