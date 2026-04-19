import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hotel_crm";

async function main() {
  console.log("🌱 Seeding database...");

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // Clear existing data
  await db.execute(
    sql`TRUNCATE TABLE sync_logs, campaigns, interactions, bookings, guests, rooms, users, permissions RESTART IDENTITY CASCADE`,
  );

  // Users with bcrypt hashes (bcrypt of: admin123, manager123, marketing123, reception123)
  const bcrypt = await import("bcrypt");
  const saltRounds = 10;

  const adminHash = await bcrypt.hash("admin123", saltRounds);
  const managerHash = await bcrypt.hash("manager123", saltRounds);
  const marketingHash = await bcrypt.hash("marketing123", saltRounds);
  const receptionHash = await bcrypt.hash("reception123", saltRounds);

  const users = await db
    .insert(schema.users)
    .values([
      {
        email: "admin@hotel.com",
        passwordHash: adminHash,
        name: "Администратор",
        role: "admin",
        onboardingCompleted: false,
      },
      {
        email: "manager@hotel.com",
        passwordHash: managerHash,
        name: "Менеджер",
        role: "manager",
        onboardingCompleted: false,
      },
      {
        email: "marketing@hotel.com",
        passwordHash: marketingHash,
        name: "Маркетолог",
        role: "marketing",
        onboardingCompleted: false,
      },
      {
        email: "reception@hotel.com",
        passwordHash: receptionHash,
        name: "Рецепционист",
        role: "receptionist",
        onboardingCompleted: false,
      },
    ])
    .returning();

  console.log(`✅ Created ${users.length} users`);

  // Rooms
  const rooms = await db
    .insert(schema.rooms)
    .values([
      {
        number: "101",
        type: "Стандарт",
        floor: 1,
        pricePerNight: "5000",
        capacity: 2,
        amenities: ["WiFi", "TV"],
        isActive: true,
      },
      {
        number: "102",
        type: "Делюкс",
        floor: 1,
        pricePerNight: "8000",
        capacity: 2,
        amenities: ["WiFi", "TV", "Минибар"],
        isActive: true,
      },
      {
        number: "201",
        type: "Люкс",
        floor: 2,
        pricePerNight: "12000",
        capacity: 4,
        amenities: ["WiFi", "TV", "Минибар", "Балкон"],
        isActive: true,
      },
      {
        number: "202",
        type: "Стандарт",
        floor: 2,
        pricePerNight: "5000",
        capacity: 2,
        amenities: ["WiFi", "TV"],
        isActive: true,
      },
      {
        number: "301",
        type: "Президентский",
        floor: 3,
        pricePerNight: "25000",
        capacity: 6,
        amenities: ["WiFi", "TV", "Минибар", "Сауна", "Балкон"],
        isActive: true,
      },
    ])
    .returning();

  console.log(`✅ Created ${rooms.length} rooms`);

  // Guests
  const guests = await db
    .insert(schema.guests)
    .values([
      {
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@test.com",
        phone: "+7 999 123-45-67",
        preferences: { language: "ru", notifications: true },
        tags: ["VIP"],
        totalVisits: 5,
        totalSpent: "45000",
        notes: "Предпочитает тихий номер",
      },
      {
        firstName: "Анна",
        lastName: "Сидорова",
        email: "anna@test.com",
        phone: "+7 999 234-56-78",
        totalVisits: 2,
        totalSpent: "12000",
      },
      {
        firstName: "Пётр",
        lastName: "Иванов",
        email: "petr@test.com",
        phone: "+7 999 345-67-89",
        preferences: { lateCheckOut: true },
        tags: ["Постоянный гость"],
        totalVisits: 12,
        totalSpent: "156000",
        notes: "Постоянный гость, бизнес-поездки",
      },
      {
        firstName: "Елена",
        lastName: "Козлова",
        email: "elena@test.com",
        phone: "+7 999 456-78-90",
        totalVisits: 1,
        totalSpent: "8000",
      },
      {
        firstName: "Дмитрий",
        lastName: "Морозов",
        email: "dmitry@test.com",
        phone: "+7 999 567-89-01",
        preferences: { earlyCheckIn: true },
        tags: ["VIP"],
        totalVisits: 8,
        totalSpent: "92000",
        notes: "VIP клиент",
      },
      {
        firstName: "Ольга",
        lastName: "Новикова",
        email: "olga@test.com",
        phone: "+7 999 678-90-12",
        totalVisits: 3,
        totalSpent: "24000",
      },
      {
        firstName: "Сергей",
        lastName: "Волков",
        email: "sergey@test.com",
        phone: "+7 999 789-01-23",
        totalVisits: 1,
        totalSpent: "5000",
      },
      {
        firstName: "Мария",
        lastName: "Лебедева",
        email: "maria@test.com",
        phone: "+7 999 890-12-34",
        preferences: { floor: "high" },
        tags: ["Постоянный гость"],
        totalVisits: 6,
        totalSpent: "67000",
      },
      {
        firstName: "Алексей",
        lastName: "Соколов",
        email: "alexey@test.com",
        phone: "+7 999 901-23-45",
        totalVisits: 1,
        totalSpent: "5000",
      },
      {
        firstName: "Наталья",
        lastName: "Кузнецова",
        email: "natasha@test.com",
        phone: "+7 999 012-34-56",
        preferences: { quietRoom: true },
        tags: ["VIP"],
        totalVisits: 15,
        totalSpent: "180000",
        notes: "Самый лояльный клиент",
      },
    ])
    .returning();

  console.log(`✅ Created ${guests.length} guests`);

  // Bookings
  const bookings = await db
    .insert(schema.bookings)
    .values([
      {
        guestId: guests[0].id,
        roomId: rooms[0].id,
        checkInDate: new Date("2024-03-20"),
        checkOutDate: new Date("2024-03-25"),
        status: "confirmed",
        totalPrice: "25000",
        paidAmount: "25000",
        paymentStatus: "paid",
        source: "Booking.com",
        notes: "Поздний выезд по договоренности",
      },
      {
        guestId: guests[1].id,
        roomId: rooms[1].id,
        checkInDate: new Date("2024-03-22"),
        checkOutDate: new Date("2024-03-24"),
        status: "pending",
        totalPrice: "12000",
        paidAmount: "0",
        paymentStatus: "unpaid",
        source: "Прямая бронь",
      },
      {
        guestId: guests[2].id,
        roomId: rooms[2].id,
        checkInDate: new Date("2024-03-25"),
        checkOutDate: new Date("2024-03-30"),
        status: "checked_in",
        totalPrice: "35000",
        paidAmount: "17500",
        paymentStatus: "partial",
        source: "Авиабизнес",
        notes: "Бизнес-поездка",
      },
      {
        guestId: guests[3].id,
        roomId: rooms[3].id,
        checkInDate: new Date("2024-04-01"),
        checkOutDate: new Date("2024-04-03"),
        status: "checked_out",
        totalPrice: "10000",
        paidAmount: "10000",
        paymentStatus: "paid",
        source: "Островок",
      },
      {
        guestId: guests[4].id,
        roomId: rooms[4].id,
        checkInDate: new Date("2024-04-10"),
        checkOutDate: new Date("2024-04-15"),
        status: "confirmed",
        totalPrice: "125000",
        paidAmount: "62500",
        paymentStatus: "partial",
        source: "Прямая бронь",
        notes: "Юбилей",
      },
      {
        guestId: guests[5].id,
        roomId: rooms[1].id,
        checkInDate: new Date("2024-04-16"),
        checkOutDate: new Date("2024-04-18"),
        status: "pending",
        totalPrice: "16000",
        paidAmount: "0",
        paymentStatus: "unpaid",
        source: "Booking.com",
      },
      {
        guestId: guests[9].id,
        roomId: rooms[4].id,
        checkInDate: new Date("2024-04-20"),
        checkOutDate: new Date("2024-04-25"),
        status: "confirmed",
        totalPrice: "125000",
        paidAmount: "125000",
        paymentStatus: "paid",
        source: "Virtuoso",
        notes: "VIP пакет",
      },
      {
        guestId: guests[6].id,
        roomId: rooms[0].id,
        checkInDate: new Date("2024-03-10"),
        checkOutDate: new Date("2024-03-12"),
        status: "checked_out",
        totalPrice: "10000",
        paidAmount: "10000",
        paymentStatus: "paid",
        source: "Островок",
      },
      {
        guestId: guests[7].id,
        roomId: rooms[2].id,
        checkInDate: new Date("2024-04-05"),
        checkOutDate: new Date("2024-04-08"),
        status: "checked_out",
        totalPrice: "36000",
        paidAmount: "36000",
        paymentStatus: "paid",
        source: "Прямая бронь",
      },
      {
        guestId: guests[8].id,
        roomId: rooms[3].id,
        checkInDate: new Date("2024-03-15"),
        checkOutDate: new Date("2024-03-16"),
        status: "cancelled",
        totalPrice: "5000",
        paidAmount: "0",
        paymentStatus: "unpaid",
        source: "Booking.com",
        notes: "Отменил за 2 дня",
      },
      {
        guestId: guests[0].id,
        roomId: rooms[2].id,
        checkInDate: new Date("2024-05-01"),
        checkOutDate: new Date("2024-05-05"),
        status: "pending",
        totalPrice: "48000",
        paidAmount: "0",
        paymentStatus: "unpaid",
        source: "Прямая бронь",
      },
    ])
    .returning();

  console.log(`✅ Created ${bookings.length} bookings`);

  // Interactions
  await db.insert(schema.interactions).values([
    {
      guestId: guests[0].id,
      bookingId: bookings[0].id,
      userId: users[0].id,
      type: "call",
      subject: "Подтверждение брони",
      content: "Позвонили подтвердить даты",
    },
    {
      guestId: guests[0].id,
      bookingId: bookings[0].id,
      userId: users[0].id,
      type: "email",
      subject: "Напоминание",
      content: "Отправили напоминание о заезде",
    },
    {
      guestId: guests[1].id,
      type: "call",
      subject: "Запрос на бронь",
      content: "Интересуются доступностью на выходные",
    },
    {
      guestId: guests[2].id,
      bookingId: bookings[2].id,
      userId: users[0].id,
      type: "compliment",
      subject: "Благодарность",
      content: "Понравился сервис, оставили хороший отзыв",
    },
    {
      guestId: guests[1].id,
      bookingId: bookings[1].id,
      userId: users[0].id,
      type: "complaint",
      subject: "Жалоба на шум",
      content: "Пожаловались на шум из соседнего номера",
    },
    {
      guestId: guests[4].id,
      userId: users[0].id,
      type: "meeting",
      subject: "Личная встреча",
      content: "Обсудили условия для постоянного клиента",
    },
    {
      guestId: guests[9].id,
      bookingId: bookings[6].id,
      userId: users[0].id,
      type: "email",
      subject: "VIP обслуживание",
      content: "Подготовили номер с шампанским и фруктами",
    },
    {
      guestId: guests[7].id,
      type: "call",
      subject: "Запрос на доп.услуги",
      content: "Интересуется трансфером из аэропорта",
    },
  ]);

  console.log("✅ Created 8 interactions");

  // Campaigns
  await db.insert(schema.campaigns).values([
    {
      name: "Добро пожаловать",
      subject: "Добро пожаловать в Hotel RM!",
      content: "Мы рады приветствовать вас в нашем отеле...",
      status: "sent",
      sentAt: new Date("2024-03-01"),
      stats: { sent: 150, opened: 89, clicked: 45 },
    },
    {
      name: "Скидка на выходные",
      subject: "Специальное предложение на эти выходные!",
      content: "Забронируйте сейчас и получите скидку 15%...",
      status: "scheduled",
      scheduledAt: new Date("2024-03-25"),
      stats: null,
    },
    {
      name: "Поздравление с днём рождения",
      subject: "С днём рождения!",
      content: "Поздравляем вас с днём рождения! В этот особенный день...",
      status: "draft",
      stats: null,
    },
  ]);

  console.log("✅ Created 3 campaigns");

  // Permissions
  const permissionsMatrix = [
    // admin: всё
    { role: "admin", resource: "guests", action: "read" },
    { role: "admin", resource: "guests", action: "create" },
    { role: "admin", resource: "guests", action: "update" },
    { role: "admin", resource: "guests", action: "delete" },
    { role: "admin", resource: "bookings", action: "read" },
    { role: "admin", resource: "bookings", action: "create" },
    { role: "admin", resource: "bookings", action: "update" },
    { role: "admin", resource: "bookings", action: "delete" },
    { role: "admin", resource: "reports", action: "read" },
    { role: "admin", resource: "campaigns", action: "read" },
    { role: "admin", resource: "campaigns", action: "create" },
    { role: "admin", resource: "campaigns", action: "send" },
    { role: "admin", resource: "financials", action: "read" },
    { role: "admin", resource: "channels", action: "read" },
    { role: "admin", resource: "channels", action: "sync" },
    { role: "admin", resource: "segments", action: "read" },
    { role: "admin", resource: "segments", action: "create" },
    { role: "admin", resource: "segments", action: "delete" },
    { role: "admin", resource: "users", action: "read" },
    { role: "admin", resource: "users", action: "manage" },
    // manager: всё кроме delete
    { role: "manager", resource: "guests", action: "read" },
    { role: "manager", resource: "guests", action: "create" },
    { role: "manager", resource: "guests", action: "update" },
    { role: "manager", resource: "bookings", action: "read" },
    { role: "manager", resource: "bookings", action: "create" },
    { role: "manager", resource: "bookings", action: "update" },
    { role: "manager", resource: "reports", action: "read" },
    { role: "manager", resource: "campaigns", action: "read" },
    { role: "manager", resource: "campaigns", action: "create" },
    { role: "manager", resource: "campaigns", action: "send" },
    { role: "manager", resource: "financials", action: "read" },
    { role: "manager", resource: "channels", action: "read" },
    { role: "manager", resource: "segments", action: "read" },
    { role: "manager", resource: "segments", action: "create" },
    // marketing: кампнии и гости
    { role: "marketing", resource: "guests", action: "read" },
    { role: "marketing", resource: "bookings", action: "read" },
    { role: "marketing", resource: "reports", action: "read" },
    { role: "marketing", resource: "campaigns", action: "read" },
    { role: "marketing", resource: "campaigns", action: "create" },
    { role: "marketing", resource: "campaigns", action: "send" },
    { role: "marketing", resource: "segments", action: "read" },
    { role: "marketing", resource: "segments", action: "create" },
    // receptionist: гости и брони
    { role: "receptionist", resource: "guests", action: "read" },
    { role: "receptionist", resource: "guests", action: "create" },
    { role: "receptionist", resource: "guests", action: "update" },
    { role: "receptionist", resource: "bookings", action: "read" },
    { role: "receptionist", resource: "bookings", action: "create" },
    { role: "receptionist", resource: "bookings", action: "update" },
    { role: "receptionist", resource: "interactions", action: "read" },
    { role: "receptionist", resource: "interactions", action: "create" },
  ];

  await db.insert(schema.permissions).values(permissionsMatrix);
  console.log(`✅ Created ${permissionsMatrix.length} permissions`);

  console.log("\n🎉 Database seed completed successfully!");
  console.log("\nUsers:");
  console.log("  admin@hotel.com / admin123");
  console.log("  manager@hotel.com / manager123");
  console.log("  marketing@hotel.com / marketing123");
  console.log("  reception@hotel.com / reception123");

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
