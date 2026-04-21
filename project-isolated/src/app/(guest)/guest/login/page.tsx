import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/auth/jwt";
import GuestLoginForm from "./GuestLoginForm";

export default async function GuestLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("guest_token")?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.scope === "guest") redirect("/guest/bookings");
  }
  return <GuestLoginForm />;
}
