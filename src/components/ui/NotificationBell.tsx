"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useSocket";
import type { NotificationPayload } from "@/ws/index";

const TYPE_ICON: Record<NotificationPayload["type"], string> = {
  booking_created: "📅",
  booking_status: "🔄",
  campaign_sent: "📧",
  info: "ℹ️",
};

export function NotificationBell() {
  const { notifications, unread, markAllRead, connected } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={connected ? "Уведомления (подключено)" : "Уведомления (нет соединения)"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {!connected && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gray-400 rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Уведомления</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                {connected ? "online" : "offline"}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">Нет уведомлений</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{TYPE_ICON[n.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
