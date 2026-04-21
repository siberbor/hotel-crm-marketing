"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { NotificationPayload } from "@/ws/index";

let globalSocket: Socket | null = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io({ path: "/api/ws", reconnectionDelay: 1000 });
    }
    socketRef.current = globalSocket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    globalSocket.on("connect", onConnect);
    globalSocket.on("disconnect", onDisconnect);

    if (globalSocket.connected) setConnected(true);

    return () => {
      globalSocket?.off("connect", onConnect);
      globalSocket?.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export function useNotifications() {
  const { socket, connected } = useSocket();
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (payload: NotificationPayload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 50));
      setUnread((n) => n + 1);
    };

    socket.on("notification:new", onNotification);
    return () => { socket.off("notification:new", onNotification); };
  }, [socket]);

  const markAllRead = useCallback(() => setUnread(0), []);

  return { notifications, unread, markAllRead, connected };
}
