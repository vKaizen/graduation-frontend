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
    const token = getAuthCookie();
    const userId = getUserIdCookie();

    if (token && userId) {
      setAuthState({
        accessToken: token,
        userId: userId,
        username: null, // We'll need to fetch this from the server or store it separately
      });
    }
    setInitialized(true);
  }, []);

  const login = (token: string, userId: string, username?: string) => {
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
    // Clear cookies
    clearAuthCookies();

    // Clear state
    setAuthState({
      accessToken: null,
      userId: null,
      username: null,
    });

    // Redirect to home/login
    router.push("/");
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
