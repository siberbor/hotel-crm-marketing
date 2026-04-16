import { NextResponse } from "next/server";
import * as guestService from "@/services/guest.service";
import * as bookingService from "@/services/booking.service";

export async function GET() {
  try {
    const [guestsData, bookingsData] = await Promise.all([
      guestService.getAllGuests(1, 1000),
      bookingService.getAllBookings(1, 1000),
    ]);

    const guests = guestsData.data;
    const bookings = bookingsData.data;

    const revenue = bookings.reduce(
      (sum, b) => sum + parseInt(b.totalPrice || "0"),
      0,
    );
    const paidRevenue = bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + parseInt(b.totalPrice || "0"), 0);
    const occupancy = Math.round(
      (bookings.filter(
        (b) => b.status === "checked_in" || b.status === "confirmed",
      ).length /
        Math.max(bookings.length, 1)) *
        100,
    );

    const sourceStats: Record<string, number> = {};
    bookings.forEach((b) => {
      const source = b.source || "Прямая";
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    });
    const topSources = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const totalGuests = guests.length;
    const totalSpent = guests.reduce(
      (sum, g) => sum + parseInt(g.totalSpent || "0"),
      0,
    );
    const avgSpent = totalGuests > 0 ? Math.round(totalSpent / totalGuests) : 0;

    return NextResponse.json({
      data: {
        overview: {
          totalGuests,
          totalBookings: bookings.length,
          occupancy,
          totalRevenue: revenue,
          paidRevenue,
          avgGuestSpent: avgSpent,
        },
        topSources,
        recentRevenue: bookings.slice(0, 10).map((b) => ({
          id: b.id,
          amount: parseInt(b.totalPrice),
          date: b.createdAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка получения отчётов" },
      },
      { status: 500 },
    );
  }
}
