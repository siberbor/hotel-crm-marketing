type DemoGuest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  preferences: Record<string, unknown> | null;
  tags: string[];
  notes: string | null;
  totalVisits: number;
  totalSpent: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type DemoRoom = {
  id: number;
  number: string;
  type: string;
  floor: number;
  pricePerNight: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: Date | null;
};

type DemoBooking = {
  id: number;
  guestId: number;
  roomId: number;
  checkInDate: Date;
  checkOutDate: Date;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  totalPrice: string;
  paidAmount: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  source: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const ROOMS: DemoRoom[] = [
  { id: 1, number: "101", type: "Стандарт", floor: 1, pricePerNight: "3500", capacity: 2, amenities: ["Wi-Fi", "TV", "Душ"], isActive: true, createdAt: new Date() },
  { id: 2, number: "102", type: "Стандарт", floor: 1, pricePerNight: "3500", capacity: 2, amenities: ["Wi-Fi", "TV", "Душ"], isActive: true, createdAt: new Date() },
  { id: 3, number: "201", type: "Делюкс", floor: 2, pricePerNight: "5500", capacity: 2, amenities: ["Wi-Fi", "TV", "Ванна", "Мини-бар"], isActive: true, createdAt: new Date() },
  { id: 4, number: "202", type: "Делюкс", floor: 2, pricePerNight: "5500", capacity: 3, amenities: ["Wi-Fi", "TV", "Ванна", "Мини-бар"], isActive: true, createdAt: new Date() },
  { id: 5, number: "203", type: "Делюкс", floor: 2, pricePerNight: "6000", capacity: 2, amenities: ["Wi-Fi", "TV", "Ванна", "Балкон"], isActive: true, createdAt: new Date() },
  { id: 6, number: "301", type: "Люкс", floor: 3, pricePerNight: "9500", capacity: 2, amenities: ["Wi-Fi", "TV", "Джакузи", "Мини-бар", "Гостиная"], isActive: true, createdAt: new Date() },
  { id: 7, number: "302", type: "Люкс", floor: 3, pricePerNight: "9500", capacity: 2, amenities: ["Wi-Fi", "TV", "Джакузи", "Мини-бар", "Балкон"], isActive: true, createdAt: new Date() },
  { id: 8, number: "401", type: "Президентский", floor: 4, pricePerNight: "18000", capacity: 4, amenities: ["Wi-Fi", "TV", "Джакузи", "Кухня", "2 спальни", "Панорамный вид"], isActive: true, createdAt: new Date() },
  { id: 9, number: "103", type: "Эконом", floor: 1, pricePerNight: "2200", capacity: 1, amenities: ["Wi-Fi", "TV"], isActive: true, createdAt: new Date() },
  { id: 10, number: "104", type: "Эконом", floor: 1, pricePerNight: "2200", capacity: 1, amenities: ["Wi-Fi", "TV"], isActive: true, createdAt: new Date() },
];

const GUESTS: DemoGuest[] = [
  { id: 1, firstName: "Александр", lastName: "Петров", email: "petrov@email.com", phone: "+7 900 123-45-67", preferences: { pillow: "мягкая" }, tags: ["vip"], notes: null, totalVisits: 5, totalSpent: "47500", createdAt: new Date("2024-01-15"), updatedAt: null },
  { id: 2, firstName: "Мария", lastName: "Иванова", email: "ivanova@email.com", phone: "+7 911 234-56-78", preferences: null, tags: [], notes: "Аллергия на пух", totalVisits: 2, totalSpent: "11000", createdAt: new Date("2024-03-20"), updatedAt: null },
  { id: 3, firstName: "Дмитрий", lastName: "Смирнов", email: "smirnov@mail.ru", phone: "+7 925 345-67-89", preferences: { floor: "высокий" }, tags: ["постоянный"], notes: null, totalVisits: 8, totalSpent: "76000", createdAt: new Date("2023-11-05"), updatedAt: null },
  { id: 4, firstName: "Елена", lastName: "Козлова", email: "kozlova@gmail.com", phone: "+7 916 456-78-90", preferences: null, tags: [], notes: null, totalVisits: 1, totalSpent: "5500", createdAt: new Date("2024-06-10"), updatedAt: null },
  { id: 5, firstName: "Сергей", lastName: "Новиков", email: null, phone: "+7 903 567-89-01", preferences: null, tags: ["корпоратив"], notes: "Командировка", totalVisits: 3, totalSpent: "28500", createdAt: new Date("2024-02-28"), updatedAt: null },
];

const BOOKINGS: DemoBooking[] = [
  { id: 1, guestId: 1, roomId: 3, checkInDate: new Date("2026-04-18"), checkOutDate: new Date("2026-04-22"), status: "confirmed", totalPrice: "22000", paidAmount: "22000", paymentStatus: "paid", source: "Прямая бронь", notes: null, createdAt: new Date(), updatedAt: null },
  { id: 2, guestId: 3, roomId: 6, checkInDate: new Date("2026-04-17"), checkOutDate: new Date("2026-04-20"), status: "checked_in", totalPrice: "28500", paidAmount: "28500", paymentStatus: "paid", source: "Booking.com", notes: null, createdAt: new Date(), updatedAt: null },
  { id: 3, guestId: 2, roomId: 1, checkInDate: new Date("2026-04-20"), checkOutDate: new Date("2026-04-23"), status: "pending", totalPrice: "10500", paidAmount: "0", paymentStatus: "unpaid", source: null, notes: null, createdAt: new Date(), updatedAt: null },
];

let nextGuestId = GUESTS.length + 1;
let nextBookingId = BOOKINGS.length + 1;

export const demoStore = {
  getRooms: () => [...ROOMS].filter((r) => r.isActive).sort((a, b) => a.number.localeCompare(b.number)),

  getGuests: (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const data = [...GUESTS].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(offset, offset + limit);
    return { data, total: GUESTS.length, page, limit };
  },

  searchGuests: (query: string) => {
    const q = query.toLowerCase();
    return GUESTS.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.includes(q),
    );
  },

  createGuest: (input: { firstName: string; lastName: string; email?: string; phone?: string; notes?: string; tags?: string[] }) => {
    const guest: DemoGuest = {
      id: nextGuestId++,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || null,
      phone: input.phone || null,
      preferences: null,
      tags: input.tags || [],
      notes: input.notes || null,
      totalVisits: 0,
      totalSpent: "0",
      createdAt: new Date(),
      updatedAt: null,
    };
    GUESTS.push(guest);
    return guest;
  },

  getBookings: (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const data = [...BOOKINGS].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).slice(offset, offset + limit);
    return { data, total: BOOKINGS.length, page, limit };
  },

  getBookingsByGuest: (guestId: number) => BOOKINGS.filter((b) => b.guestId === guestId),

  getActiveBookings: () => BOOKINGS.filter((b) => b.status === "confirmed" || b.status === "checked_in"),

  createBooking: (input: { guestId: number; roomId: number; checkInDate: Date; checkOutDate: Date; totalPrice: string; source?: string; notes?: string }) => {
    const booking: DemoBooking = {
      id: nextBookingId++,
      guestId: input.guestId,
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      status: "pending",
      totalPrice: input.totalPrice,
      paidAmount: "0",
      paymentStatus: "unpaid",
      source: input.source || null,
      notes: input.notes || null,
      createdAt: new Date(),
      updatedAt: null,
    };
    BOOKINGS.push(booking);
    return booking;
  },

  updateBookingStatus: (id: number, status: DemoBooking["status"]) => {
    const booking = BOOKINGS.find((b) => b.id === id);
    if (booking) booking.status = status;
    return booking || null;
  },
};
