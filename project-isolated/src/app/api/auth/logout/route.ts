import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ data: { success: true } });

  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });

  return response;
}
