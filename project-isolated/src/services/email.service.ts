import { Resend } from "resend";
import { db, campaigns, guests, bookings, rooms } from "@/db";
import { eq } from "drizzle-orm";
import { demoStore } from "@/lib/demo-store";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || "CRM Hotel <noreply@hotel.local>";

// ── Templates ──────────────────────────────────────────────────────────────

function bookingConfirmationHtml(params: {
  guestName: string;
  bookingId: number;
  checkIn: string;
  checkOut: string;
  roomLabel: string;
  totalPrice: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #2563EB; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
  .body { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; }
  .field { margin: 8px 0; } .label { color: #6b7280; font-size: 13px; }
  .value { font-weight: 600; }
  .footer { color: #9ca3af; font-size: 12px; padding: 16px 0; text-align: center; }
</style></head>
<body>
  <div class="header"><h2 style="margin:0">Подтверждение бронирования #${params.bookingId}</h2></div>
  <div class="body">
    <p>Уважаемый(ая) <strong>${params.guestName}</strong>,</p>
    <p>Ваше бронирование подтверждено.</p>
    <div class="field"><span class="label">Номер:</span> <span class="value">${params.roomLabel}</span></div>
    <div class="field"><span class="label">Заезд:</span> <span class="value">${params.checkIn}</span></div>
    <div class="field"><span class="label">Выезд:</span> <span class="value">${params.checkOut}</span></div>
    <div class="field"><span class="label">Сумма:</span> <span class="value">₽${params.totalPrice}</span></div>
  </div>
  <div class="footer">Это письмо сформировано автоматически. Hotel CRM</div>
</body>
</html>`;
}

function bookingCancellationHtml(params: {
  guestName: string;
  bookingId: number;
  checkIn: string;
  checkOut: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #dc2626; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
  .body { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; }
  .footer { color: #9ca3af; font-size: 12px; padding: 16px 0; text-align: center; }
</style></head>
<body>
  <div class="header"><h2 style="margin:0">Бронирование #${params.bookingId} отменено</h2></div>
  <div class="body">
    <p>Уважаемый(ая) <strong>${params.guestName}</strong>,</p>
    <p>Ваше бронирование на период <strong>${params.checkIn} — ${params.checkOut}</strong> было отменено.</p>
    <p>Если это ошибка, свяжитесь с нами.</p>
  </div>
  <div class="footer">Hotel CRM</div>
</body>
</html>`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getBookingWithDetails(bookingId: number) {
  try {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!booking) return null;
    const [guest] = await db.select().from(guests).where(eq(guests.id, booking.guestId));
    const [room] = await db.select().from(rooms).where(eq(rooms.id, booking.roomId));
    return { booking, guest, room };
  } catch {
    // Fallback to demo store
    const demoBooking = demoStore.getBookings().data.find((b: { id: number }) => b.id === bookingId);
    return demoBooking ? { booking: demoBooking, guest: null, room: null } : null;
  }
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function sendBookingConfirmation(bookingId: number): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const data = await getBookingWithDetails(bookingId);
  if (!data?.booking || !data.guest?.email) return;

  const { booking, guest, room } = data;
  await resend.emails.send({
    from: FROM,
    to: guest.email as string,
    subject: `Подтверждение бронирования #${bookingId}`,
    html: bookingConfirmationHtml({
      guestName: `${guest.firstName} ${guest.lastName}`,
      bookingId,
      checkIn: formatDate(booking.checkInDate),
      checkOut: formatDate(booking.checkOutDate),
      roomLabel: room ? `№${room.number} · ${room.type}` : `#${booking.roomId}`,
      totalPrice: parseInt(booking.totalPrice).toLocaleString("ru"),
    }),
  });
}

export async function sendBookingCancellation(bookingId: number): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const data = await getBookingWithDetails(bookingId);
  if (!data?.booking || !data.guest?.email) return;

  const { booking, guest } = data;
  await resend.emails.send({
    from: FROM,
    to: guest.email as string,
    subject: `Бронирование #${bookingId} отменено`,
    html: bookingCancellationHtml({
      guestName: `${guest.firstName} ${guest.lastName}`,
      bookingId,
      checkIn: formatDate(booking.checkInDate),
      checkOut: formatDate(booking.checkOutDate),
    }),
  });
}

export async function sendCampaignEmails(campaignId: number): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  let campaign;
  try {
    [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  } catch {
    return;
  }
  if (!campaign) return;

  // Get target guests: all with email, or filtered by segment
  let targets: { email: string | null; firstName: string; lastName: string }[] = [];
  try {
    targets = await db
      .select({ email: guests.email, firstName: guests.firstName, lastName: guests.lastName })
      .from(guests);
  } catch {
    return;
  }

  const withEmail = targets.filter((g) => g.email);
  if (withEmail.length === 0) return;

  // Batch send (Resend free tier: 1 email/s — use batch API)
  const batch = withEmail.map((g) => ({
    from: FROM,
    to: g.email as string,
    subject: campaign.subject,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:20px">
      <p>Уважаемый(ая) ${g.firstName} ${g.lastName},</p>
      ${campaign.content.replace(/\n/g, "<br>")}
      <hr style="margin-top:32px;border-color:#e5e7eb">
      <p style="color:#9ca3af;font-size:12px">Отписаться от рассылки</p>
    </body></html>`,
  }));

  // Resend batch API: max 100 per call
  for (let i = 0; i < batch.length; i += 100) {
    await resend.batch.send(batch.slice(i, i + 100));
  }

  // Update campaign stats
  try {
    await db
      .update(campaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
        stats: { sent: withEmail.length, opened: 0, clicked: 0 },
      })
      .where(eq(campaigns.id, campaignId));
  } catch {
    // non-critical
  }
}
