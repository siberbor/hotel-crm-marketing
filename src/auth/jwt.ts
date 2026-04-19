import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me-min-32-chars",
);

const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-min-32",
);

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  scope?: "staff" | "guest";
  guestId?: number;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function createGuestToken(payload: {
  userId: number;
  email: string;
  guestId: number;
}): Promise<string> {
  return new SignJWT({ ...payload, role: "guest", scope: "guest" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function createRefreshToken(
  payload: TokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
