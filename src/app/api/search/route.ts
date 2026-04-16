import { NextRequest, NextResponse } from "next/server";
import * as guestService from "@/services/guest.service";
import * as bookingService from "@/services/booking.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  if (!query || query.length < 2) {
    return NextResponse.json({ data: { guests: [], bookings: [] } });
  }

  try {
    const results: { guests?: unknown[]; bookings?: unknown[] } = {};

    if (type === "all" || type === "guests") {
      const guests = await guestService.searchGuests(query);
      results.guests = guests.slice(0, 10);
    }

    if (type === "all" || type === "bookings") {
      const bookingsData = await bookingService.getAllBookings(1, 100);
      const q = query.toLowerCase();
      results.bookings = bookingsData.data
        .filter((b: any) => String(b.id).includes(q))
        .slice(0, 10);
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка поиска" } },
      { status: 500 },
    );
  }
}
