export const qk = {
  guests: {
    all: ["guests"] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      ["guests", "list", params] as const,
    detail: (id: number) => ["guests", id] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      ["bookings", "list", params] as const,
    byGuest: (guestId: number) => ["bookings", "guest", guestId] as const,
    detail: (id: number) => ["bookings", id] as const,
  },
  interactions: {
    all: ["interactions"] as const,
    list: (params?: { guestId?: number; page?: number }) =>
      ["interactions", "list", params] as const,
  },
  campaigns: {
    all: ["campaigns"] as const,
    list: () => ["campaigns", "list"] as const,
  },
  segments: {
    all: ["segments"] as const,
    list: () => ["segments", "list"] as const,
  },
  rooms: {
    all: ["rooms"] as const,
    available: () => ["rooms", "available"] as const,
  },
  channels: {
    logs: (params?: { page?: number }) => ["channels", "logs", params] as const,
  },
  reports: {
    all: () => ["reports"] as const,
  },
  auth: {
    me: () => ["auth", "me"] as const,
  },
} as const;
