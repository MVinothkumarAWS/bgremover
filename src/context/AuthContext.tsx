"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export interface User {
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isSignedIn: false,
  login: () => ({ success: false }),
  signup: () => ({ success: false }),
  logout: () => {},
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bgr-user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    if (!name || !email || !password) return { success: false, error: "All fields are required" };
    if (password.length < 6) return { success: false, error: "Password must be at least 6 characters" };
    if (!email.includes("@")) return { success: false, error: "Invalid email address" };

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem("bgr-users") || "{}");
    if (users[email]) return { success: false, error: "Account already exists. Please log in." };

    // Save user
    users[email] = { name, password: btoa(password), createdAt: new Date().toISOString() };
    localStorage.setItem("bgr-users", JSON.stringify(users));

    const newUser: User = { email, name, createdAt: new Date().toISOString() };
    setUser(newUser);
    localStorage.setItem("bgr-user", JSON.stringify(newUser));

    // Give 5 free HD credits on signup
    const premium = JSON.parse(localStorage.getItem("bgr-premium") || "{}");
    premium.credits = (premium.credits || 0) + 5;
    localStorage.setItem("bgr-premium", JSON.stringify(premium));

    return { success: true };
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (!email || !password) return { success: false, error: "Email and password are required" };

    const users = JSON.parse(localStorage.getItem("bgr-users") || "{}");
    const stored = users[email];
    if (!stored) return { success: false, error: "No account found. Please sign up." };
    if (atob(stored.password) !== password) return { success: false, error: "Incorrect password" };

    const loggedInUser: User = { email, name: stored.name, createdAt: stored.createdAt };
    setUser(loggedInUser);
    localStorage.setItem("bgr-user", JSON.stringify(loggedInUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("bgr-user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isSignedIn: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useLocalAuth() {
  return useContext(AuthContext);
}
