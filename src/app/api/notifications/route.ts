import { NextRequest, NextResponse } from "next/server";
import * as notificationService from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const notifications = await notificationService.getNotifications();
    const unreadCount = await notificationService.getUnreadCount();
    return NextResponse.json({ data: { notifications, unreadCount } });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка получения уведомлений",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message } = body;

    if (!type || !title) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Тип и заголовок обязательны",
          },
        },
        { status: 400 },
      );
    }

    const notification = await notificationService.addNotification({
      type,
      title,
      message: message || "",
      read: false,
    });

    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка создания уведомления",
        },
      },
      { status: 500 },
    );
  }
}
