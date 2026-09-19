import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ShoppingBag, CheckCircle, Clock, AlertCircle } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";

import { subscribeRealtime } from "../utils/realtime.js";

export default function NotificationMenu() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  function load() {
    if (!user) return;
    api.get("/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }

  useEffect(() => {
    load();

    // SSE real-time push listener (NO 4s polling -> zero 304 console loops!)
    const unsubscribe = subscribeRealtime((detail) => {
      if (detail.type === "order_updated" || detail.type === "order_created") {
        load();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.lu).length;

  async function handleNotificationClick(n) {
    // Immediately mark as read locally so badge & notification update/disappear instantly
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, lu: true } : item))
    );
    api.patch(`/notifications/${n.id}/read`).catch(() => {});
    setOpen(false);

    if (user.role === "client") {
      navigate("/mes-commandes");
    } else if (user.role === "admin" || user.role === "employe") {
      navigate("/admin/commandes");
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    api.patch("/notifications/read-all").catch(() => {});
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        title="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
          color: "var(--ink)",
          borderRadius: "50%",
          transition: "background 0.2s"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#B4483A",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              borderRadius: 10,
              padding: "1px 5px",
              lineHeight: 1,
              boxShadow: "0 2px 6px rgba(180,72,58,0.4)"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 340,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 10px 36px rgba(22,52,36,0.18)",
            border: "1px solid var(--line)",
            zIndex: 1000,
            overflow: "hidden"
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--paper)",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--forest-dark)" }}>
              Notifications ({unreadCount} non lue{unreadCount > 1 ? "s" : ""})
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--forest)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <Check size={14} /> Tout lire
              </button>
            )}
          </div>

          {/* LIST */}
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--line)",
                    background: n.lu ? "#fff" : "var(--forest-light)",
                    cursor: "pointer",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = n.lu ? "var(--paper)" : "#E2EFE7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.lu ? "#fff" : "var(--forest-light)")}
                >
                  <div
                    style={{
                      background: "var(--forest)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    <ShoppingBag size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.lu ? 600 : 700, fontSize: 13, color: "var(--ink)" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--sage)", marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!n.lu && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        flexShrink: 0,
                        marginTop: 6
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
