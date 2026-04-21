import { NextRequest, NextResponse } from "next/server";
import { createGuestToken } from "@/auth/jwt";
import * as bcrypt from "bcrypt";
import { db, guestAccounts, guests } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Имя, фамилия, email и пароль обязательны" } },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Пароль минимум 6 символов" } },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists
    const [existing] = await db
      .select({ id: guestAccounts.id })
      .from(guestAccounts)
      .where(eq(guestAccounts.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "Аккаунт с таким email уже существует" } },
        { status: 409 },
      );
    }

    // Create guest record
    const [guest] = await db
      .insert(guests)
      .values({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
      })
      .returning();

    // Create account
    const passwordHash = await bcrypt.hash(password, 10);
    const [account] = await db
      .insert(guestAccounts)
      .values({
        guestId: guest.id,
        email: normalizedEmail,
        passwordHash,
      })
      .returning();

    // Auto-login: issue token
    const token = await createGuestToken({
      userId: account.id,
      email: account.email,
      guestId: guest.id,
    });

    const response = NextResponse.json(
      { data: { guestId: guest.id, email: account.email } },
      { status: 201 },
    );

    response.cookies.set("guest_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" } },
      { status: 500 },
    );
  }
}
