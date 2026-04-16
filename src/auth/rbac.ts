export type Role = "admin" | "manager" | "marketing" | "receptionist";
export type Resource =
  | "guests"
  | "bookings"
  | "interactions"
  | "campaigns"
  | "reports"
  | "users"
  | "settings";
export type Action = "create" | "read" | "update" | "delete";

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  marketing: 2,
  receptionist: 1,
};

export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    guests: ["create", "read", "update", "delete"],
    bookings: ["create", "read", "update", "delete"],
    interactions: ["create", "read", "update", "delete"],
    campaigns: ["create", "read", "update", "delete"],
    reports: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete"],
    settings: ["create", "read", "update", "delete"],
  },
  manager: {
    guests: ["create", "read", "update"],
    bookings: ["create", "read", "update"],
    interactions: ["create", "read", "update"],
    campaigns: ["create", "read", "update"],
    reports: ["create", "read"],
    users: ["read"],
    settings: ["read"],
  },
  marketing: {
    guests: ["read", "update"],
    bookings: ["read"],
    interactions: ["create", "read"],
    campaigns: ["create", "read", "update", "delete"],
    reports: ["read"],
    users: ["read"],
    settings: ["read"],
  },
  receptionist: {
    guests: ["create", "read", "update"],
    bookings: ["create", "read", "update"],
    interactions: ["create", "read"],
    campaigns: ["read"],
    reports: [],
    users: [],
    settings: ["read"],
  },
};

export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action,
): boolean {
  const permissions = PERMISSIONS[role]?.[resource];
  if (!permissions) return false;
  return permissions.includes(action);
}

export function canDelete(role: Role): boolean {
  return role === "admin";
}

export function canSeeFinancials(role: Role): boolean {
  return role === "admin" || role === "manager";
}

export function canSendCampaigns(role: Role): boolean {
  return role === "admin" || role === "manager" || role === "marketing";
}

export function isHigherRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}
