import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";

const PERMISSION_RULES: Record<string, Record<string, string[]>> = {
  guests: {
    read: ["admin", "manager", "marketing", "receptionist"],
    create: ["admin", "manager", "receptionist"],
    update: ["admin", "manager", "receptionist"],
    delete: ["admin"],
  },
  bookings: {
    read: ["admin", "manager", "marketing", "receptionist"],
    create: ["admin", "manager", "receptionist"],
    update: ["admin", "manager", "receptionist"],
    delete: ["admin"],
  },
  interactions: {
    read: ["admin", "manager", "receptionist"],
    create: ["admin", "manager", "receptionist"],
    delete: ["admin"],
  },
  campaigns: {
    read: ["admin", "manager", "marketing"],
    create: ["admin", "manager", "marketing"],
    send: ["admin", "manager", "marketing"],
    delete: ["admin"],
  },
  reports: {
    read: ["admin", "manager", "marketing"],
  },
  segments: {
    read: ["admin", "manager", "marketing"],
    create: ["admin", "manager", "marketing"],
    delete: ["admin"],
  },
  channels: {
    read: ["admin", "manager"],
    sync: ["admin", "manager"],
  },
  users: {
    read: ["admin"],
    manage: ["admin"],
  },
  rooms: {
    read: ["admin", "manager", "receptionist"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  notifications: {
    read: ["admin", "manager", "marketing", "receptionist"],
    create: ["admin", "manager", "marketing", "receptionist"],
  },
  search: {
    read: ["admin", "manager", "marketing", "receptionist"],
  },
};

export async function permissionsMiddleware(
  request: NextRequest,
  route: string,
  action: string,
) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Требуется авторизация" } },
      { status: 401 },
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Сессия истекла" } },
      { status: 401 },
    );
  }

  const userRole = payload.role;
  const resourcePermissions = PERMISSION_RULES[route];

  if (!resourcePermissions) {
    return null;
  }

  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) {
    return null;
  }

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: `Нет прав для этого действия. Роль: ${userRole}`,
        },
      },
      { status: 403 },
    );
  }

  return null;
}

export function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;
  return verifyToken(token).then((payload) => payload?.role === "admin");
}
