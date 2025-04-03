"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    // Clear localStorage first to prevent hydration issues
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (token && userId) {
        setAuthState({
          accessToken: token,
          userId: userId,
          username: username || null,
        });
      }
    }
    setInitialized(true);
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (initialized && typeof window !== "undefined") {
      if (authState.accessToken && authState.userId) {
        localStorage.setItem("accessToken", authState.accessToken);
        localStorage.setItem("userId", authState.userId);
        if (authState.username) {
          localStorage.setItem("username", authState.username);
        }
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
      }
    }
  }, [authState, initialized]);

  const login = (token: string, userId: string, username?: string) => {
    console.log("Setting auth state:", { token, userId, username });
    setAuthState({
      accessToken: token,
      userId: userId,
      username: username || null,
    });
  };

  const logout = () => {
    setAuthState({
      accessToken: null,
      userId: null,
      username: null,
    });
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
