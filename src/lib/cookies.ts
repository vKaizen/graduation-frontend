// Cookie configuration
const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 8 * 60 * 60, // 8 hours
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const AUTH_COOKIE_NAME = "auth_token";
export const USER_ID_COOKIE = "user_id";

const isClient = typeof window !== "undefined";

export function setAuthCookie(token: string) {
  if (!isClient) return;

  const cookieValue = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `path=${COOKIE_OPTIONS.path}`,
    `max-age=${COOKIE_OPTIONS.maxAge}`,
    COOKIE_OPTIONS.secure ? "secure" : "",
    `samesite=${COOKIE_OPTIONS.sameSite}`,
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieValue;
}

export function setUserIdCookie(userId: string) {
  if (!isClient) return;

  const cookieValue = [
    `${USER_ID_COOKIE}=${userId}`,
    `path=${COOKIE_OPTIONS.path}`,
    `max-age=${COOKIE_OPTIONS.maxAge}`,
    COOKIE_OPTIONS.secure ? "secure" : "",
    `samesite=${COOKIE_OPTIONS.sameSite}`,
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieValue;
}

export function getAuthCookie(): string | null {
  if (!isClient) return null;

  const cookies = document.cookie.split(";").map((c) => c.trim());
  const authCookie = cookies.find((cookie) =>
    cookie.startsWith(`${AUTH_COOKIE_NAME}=`)
  );
  return authCookie ? authCookie.split("=")[1] : null;
}

export function getUserIdCookie(): string | null {
  if (!isClient) return null;

  const cookies = document.cookie.split(";").map((c) => c.trim());
  const userIdCookie = cookies.find((cookie) =>
    cookie.startsWith(`${USER_ID_COOKIE}=`)
  );
  return userIdCookie ? userIdCookie.split("=")[1] : null;
}

export function clearAuthCookies() {
  if (!isClient) return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${USER_ID_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
