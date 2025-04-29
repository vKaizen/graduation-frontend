import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";

export async function GET(request: NextRequest) {
  try {
    const token = getAuthCookie();

    // Check if token exists
    const hasToken = !!token;

    // If token exists, decode it
    let decoded = null;
    let isValid = false;
    let error = null;

    if (token) {
      try {
        decoded = jwtDecode(token);

        // Basic validation - check if token has not expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp > currentTime) {
          isValid = true;
        } else {
          error = "Token has expired";
        }
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to decode token";
      }
    }

    // Try making a test API call to the backend with the token
    let apiTest = null;
    if (token) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        apiTest = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        };

        if (response.ok) {
          apiTest.userData = await response.json();
        }
      } catch (e) {
        apiTest = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    return NextResponse.json({
      hasToken,
      tokenLength: token ? token.length : 0,
      decoded,
      isValid,
      error,
      apiTest,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check auth",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
