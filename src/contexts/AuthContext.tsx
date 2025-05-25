"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  setAuthCookie,
  setUserIdCookie,
  getAuthCookie,
  getUserIdCookie,
  clearAuthCookies,
} from "@/lib/cookies";

// Add a global flag to indicate logout state
let isLoggingOut = false;

// Export a function to check if we're in the process of logging out
export const getIsLoggingOut = () => isLoggingOut;

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  username: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, userId: string, username?: string) => void;
  logout: () => void;
  authState: AuthState;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    userId: null,
    username: null,
  });
  const router = useRouter();

  // Initialize auth state from cookies on mount
  useEffect(() => {
    // Reset logout flag on component mount
    isLoggingOut = false;

    const token = getAuthCookie();
    const userId = getUserIdCookie();

    console.log("AuthContext: Initializing from cookies");
    console.log("AuthContext: Token exists:", !!token);
    console.log("AuthContext: UserId from cookie:", userId);

    if (token && userId) {
      setAuthState({
        accessToken: token,
        userId: userId,
        username: null, // We'll need to fetch this from the server or store it separately
      });
      console.log("AuthContext: Set auth state with userId:", userId);
    } else {
      console.log("AuthContext: Missing token or userId in cookies");
    }
    setInitialized(true);
  }, []);

  const login = (token: string, userId: string, username?: string) => {
    // Reset logout flag when logging in
    isLoggingOut = false;

    console.log("Setting auth state:", { token, userId, username });

    // Set cookies
    setAuthCookie(token);
    setUserIdCookie(userId);

    // Update state
    setAuthState({
      accessToken: token,
      userId: userId,
      username: username || null,
    });
  };

  const logout = () => {
    // Set the logging out flag to true
    isLoggingOut = true;

    // Create an AbortController to cancel any in-flight requests
    const controller = new AbortController();
    controller.abort();

    // Clear cookies
    clearAuthCookies();

    // Clear state
    setAuthState({
      accessToken: null,
      userId: null,
      username: null,
    });

    // Redirect to home/login immediately
    router.push("/", { forceOptimisticNavigation: true });

    // Reset the logout flag after a very short delay
    // This ensures any in-flight requests complete before we reset the flag
    setTimeout(() => {
      isLoggingOut = false;
    }, 100); // Reduced from 1000ms to 100ms for faster logout
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!authState.accessToken,
        login,
        logout,
        authState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
