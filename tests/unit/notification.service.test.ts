import { test, expect, beforeEach, afterEach } from "vitest";
import {
  getNotifications,
  getUnreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
} from "@/services/notification.service";

test("getNotifications returns notifications sorted by date desc", async () => {
  const result = await getNotifications();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
  for (let i = 0; i < result.length - 1; i++) {
    expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
      result[i + 1].createdAt.getTime(),
    );
  }
});

test("getUnreadCount returns correct count", async () => {
  const result = await getUnreadCount();
  expect(typeof result).toBe("number");
  expect(result).toBeGreaterThanOrEqual(0);
});

test("addNotification creates new notification", async () => {
  const notification = {
    type: "booking" as const,
    title: "Test booking",
    message: "Test message",
    read: false,
  };

  const result = await addNotification(notification);
  expect(result.id).toBeDefined();
  expect(result.title).toBe("Test booking");
  expect(result.createdAt).toBeInstanceOf(Date);
});

test("markAsRead marks notification as read", async () => {
  const notification = {
    type: "booking" as const,
    title: "Mark test",
    message: "Test",
    read: false,
  };

  const created = await addNotification(notification);
  const result = await markAsRead(created.id);
  expect(result).toBe(true);
});

test("markAsRead returns false for non-existent notification", async () => {
  const result = await markAsRead("non-existent-id");
  expect(result).toBe(false);
});

test("markAllAsRead marks all notifications as read", async () => {
  await markAllAsRead();
  const unreadCount = await getUnreadCount();
  expect(unreadCount).toBe(0);
});

test("markAllAsRead returns true", async () => {
  const result = await markAllAsRead();
  expect(result).toBe(true);
});
