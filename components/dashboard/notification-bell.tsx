"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unread = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload: { new: Notification }) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[rgba(99,102,241,0.08)] hover:text-[#a5b4fc]"
        aria-label="Notificaciones"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366f1] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-50 w-96 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1a1a2e] px-4 py-3">
              <span className="text-sm font-semibold text-white">
                Notificaciones
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#818cf8] hover:underline"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#6b7280]">
                  Sin notificaciones
                </p>
              ) : (
                notifications.map((n) => {
                  const inner = (
                    <div
                      className={cn(
                        "px-4 py-3 transition-colors hover:bg-[rgba(99,102,241,0.06)]",
                        !n.read_at && "border-l-2 border-[#6366f1]"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm",
                          n.read_at ? "text-[#6b7280]" : "font-medium text-white"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6b7280] line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-[#3d3d5c]">
                        {new Date(n.created_at).toLocaleDateString("es-EC", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );

                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className="cursor-default"
                    >
                      {inner}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
