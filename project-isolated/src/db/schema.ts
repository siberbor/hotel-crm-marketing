import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("receptionist"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guests = pgTable(
  "guests",
  {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    preferences: jsonb("preferences"),
    tags: jsonb("tags").$type<string[]>(),
    totalVisits: integer("total_visits").default(0),
    totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default(
      "0",
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("guests_email_idx").on(table.email),
    phoneIdx: index("guests_phone_idx").on(table.phone),
  }),
);

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  floor: integer("floor").notNull(),
  pricePerNight: numeric("price_per_night", {
    precision: 10,
    scale: 2,
  }).notNull(),
  capacity: integer("capacity").notNull().default(2),
  amenities: jsonb("amenities").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id),
    roomId: integer("room_id")
      .notNull()
      .references(() => rooms.id),
    checkInDate: timestamp("check_in_date").notNull(),
    checkOutDate: timestamp("check_out_date").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default(
      "0",
    ),
    paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
    source: varchar("source", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    guestIdIdx: index("bookings_guest_idx").on(table.guestId),
    roomIdIdx: index("bookings_room_idx").on(table.roomId),
    statusIdx: index("bookings_status_idx").on(table.status),
    checkInIdx: index("bookings_checkin_idx").on(table.checkInDate),
  }),
);

export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id),
    bookingId: integer("booking_id").references(() => bookings.id),
    userId: integer("user_id").references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    content: text("content"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    guestIdIdx: index("interactions_guest_idx").on(table.guestId),
    typeIdx: index("interactions_type_idx").on(table.type),
  }),
);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  segmentId: integer("segment_id"),
  status: varchar("status", { length: 50 }).default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  stats: jsonb("stats").$type<{
    sent: number;
    opened: number;
    clicked: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    role: varchar("role", { length: 50 }).notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
  },
  (table) => ({
    roleIdx: index("permissions_role_idx").on(table.role),
  }),
);

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: serial("id").primaryKey(),
    channel: varchar("channel", { length: 100 }).notNull(),
    externalId: varchar("external_id", { length: 255 }),
    action: varchar("action", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    channelIdx: index("sync_logs_channel_idx").on(table.channel),
    statusIdx: index("sync_logs_status_idx").on(table.status),
  }),
);

// Sprint 5: guest_accounts, tasks, shifts

export const guestAccounts = pgTable(
  "guest_accounts",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .notNull()
      .references(() => guests.id),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("guest_accounts_email_idx").on(table.email),
    guestIdx: index("guest_accounts_guest_idx").on(table.guestId),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    // todo | in_progress | urgent | done | postponed
    status: varchar("status", { length: 50 }).notNull().default("todo"),
    assignedTo: integer("assigned_to").references(() => users.id),
    roomId: integer("room_id").references(() => rooms.id),
    scheduledTime: timestamp("scheduled_time"),
    notes: text("notes"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
    assignedIdx: index("tasks_assigned_idx").on(table.assignedTo),
    roomIdx: index("tasks_room_idx").on(table.roomId),
  }),
);

export const shifts = pgTable(
  "shifts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    // working | break | done
    status: varchar("status", { length: 50 }).notNull().default("working"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("shifts_user_idx").on(table.userId),
    statusIdx: index("shifts_status_idx").on(table.status),
  }),
);

export type User = typeof users.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Interaction = typeof interactions.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type SyncLog = typeof syncLogs.$inferSelect;
export type GuestAccount = typeof guestAccounts.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
