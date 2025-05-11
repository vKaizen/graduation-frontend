import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 8 * 60 * 60,
};

export const AUTH_COOKIE_NAME = "auth_token";
export const USER_ID_COOKIE = "user_id";

export async function getServerAuthCookie() {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getServerUserIdCookie() {
  const cookieStore = cookies();
  return cookieStore.get(USER_ID_COOKIE)?.value;
}
