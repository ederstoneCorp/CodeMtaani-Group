"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import type { AdminNotification } from "@/lib/notifications";

export function AdminNotificationsDropdown() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          background: open ? "rgba(69,200,216,0.2)" : "#0c1518",
          border: "1px solid #243538",
          borderRadius: "8px",
          width: "36px",
          height: "36px",
          display: "grid",
          placeItems: "center",
          color: unreadCount > 0 ? "#45c8d8" : "#8fa5a9",
          cursor: "pointer",
        }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#e00000",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 800,
              borderRadius: "999px",
              minWidth: "16px",
              height: "16px",
              display: "grid",
              placeItems: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "44px",
            width: "340px",
            maxHeight: "440px",
            background: "#081417",
            border: "1px solid #2a3c40",
            borderRadius: "10px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #1a282c",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#f1fbfc" }}>
              Notifications ({unreadCount} new)
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#45c8d8",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "#779095", fontSize: "12px" }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: n.is_read ? "transparent" : "rgba(69,200,216,0.06)",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong style={{ fontSize: "12px", color: n.is_read ? "#c8d8dc" : "#f1fbfc" }}>
                      {n.title}
                    </strong>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#45c8d8",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                        title="Mark read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8fa5a9", lineHeight: "1.5" }}>
                    {n.message}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <small style={{ color: "#5d787d", fontSize: "10px" }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                    {n.link && (
                      <a
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          color: "#45c8d8",
                          fontSize: "10px",
                        }}
                      >
                        View <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
