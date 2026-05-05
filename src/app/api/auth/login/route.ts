import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({ success: true });
  response.cookies.set("kelato_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
