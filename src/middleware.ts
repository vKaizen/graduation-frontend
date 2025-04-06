import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/server-cookies";

// Add routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes without authentication
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    const loginUrl = new URL("/login", request.url);

    // Only add callback URL if not trying to access home page
    if (pathname !== "/" && pathname !== "/home") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
