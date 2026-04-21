import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export type NotificationPayload = {
  id: string;
  type: "booking_created" | "booking_status" | "campaign_sent" | "info";
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    path: "/api/ws",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("[WS] Client connected:", socket.id);

    socket.on("join:hotel", (hotelId: string) => {
      socket.join(`hotel:${hotelId}`);
    });

    socket.on("disconnect", () => {
      console.log("[WS] Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io server not initialized");
  return io;
}

export function emitNotification(payload: NotificationPayload): void {
  if (!io) return;
  io.emit("notification:new", payload);
}

export function emitBookingCreated(booking: Record<string, unknown>): void {
  if (!io) return;
  io.emit("booking:created", booking);
  emitNotification({
    id: `booking-${booking.id}-${Date.now()}`,
    type: "booking_created",
    title: "Новое бронирование",
    message: `Бронирование #${booking.id} создано`,
    timestamp: new Date().toISOString(),
    data: booking,
  });
}

export function emitBookingStatusChanged(
  bookingId: number,
  status: string
): void {
  if (!io) return;
  io.emit("booking:status_changed", { id: bookingId, status });
  emitNotification({
    id: `status-${bookingId}-${Date.now()}`,
    type: "booking_status",
    title: "Статус бронирования изменён",
    message: `Бронирование #${bookingId} → ${status}`,
    timestamp: new Date().toISOString(),
    data: { id: bookingId, status },
  });
}
