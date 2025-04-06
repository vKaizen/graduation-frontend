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

export function getServerAuthCookie() {
  return cookies().get(AUTH_COOKIE_NAME)?.value;
}

export function getServerUserIdCookie() {
  return cookies().get(USER_ID_COOKIE)?.value;
}
