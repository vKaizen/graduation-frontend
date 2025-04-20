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

// Cookie utility functions for client-side operations

/**
 * Get a cookie by name
 * @param name Name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Check if this cookie has the name we're looking for
    if (cookie.substring(0, name.length + 1) === name + "=") {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Set a cookie with the given name and value
 * @param name Name of the cookie to set
 * @param value Value to store in the cookie
 * @param days Number of days until the cookie expires
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 30
): void {
  if (typeof document === "undefined") return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie =
    name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

/**
 * Delete a cookie by name
 * @param name Name of the cookie to delete
 */
export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;

  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// For authentication cookie handling
export function getAuthCookie(): string | null {
  return getCookie("auth_token");
}

export function setAuthCookie(token: string, days: number = 7): void {
  setCookie("auth_token", token, days);
}

export function clearAuthCookie(): void {
  deleteCookie("auth_token");
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
