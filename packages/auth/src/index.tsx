"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, CSSProperties } from "react";
import type { User, UserRole, Permissions, AuthAdapter, ExtendedAuthState } from "@litecms/core";

// Re-export types
export type { User, UserRole, Permissions, AuthAdapter, ExtendedAuthState } from "@litecms/core";

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canManageUsers: true,
    canAccessVersions: true,
    canManageMedia: true,
    canManageSettings: true,
  },
  editor: {
    canEdit: true,
    canDelete: false,
    canPublish: true,
    canManageUsers: false,
    canAccessVersions: true,
    canManageMedia: true,
    canManageSettings: false,
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canManageUsers: false,
    canAccessVersions: false,
    canManageMedia: false,
    canManageSettings: false,
  },
};

/**
 * Auth context value
 */
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permissions | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof Omit<Permissions, "fieldPermissions">) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth provider props
 */
export interface AuthProviderProps {
  children: ReactNode;
  adapter?: AuthAdapter;
  initialUser?: User | null;
}

/**
 * Auth provider component
 */
export function AuthProvider({ children, adapter, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissions = useMemo(() => {
    if (!user) return null;
    if (adapter) return adapter.getPermissions(user);
    return DEFAULT_PERMISSIONS[user.role];
  }, [user, adapter]);

  const login = useCallback(async (email: string, password: string) => {
    if (!adapter) {
      setError("No auth adapter configured");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await adapter.login({ email, password });
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, [adapter]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (adapter) await adapter.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsLoading(false);
    }
  }, [adapter]);

  const hasPermission = useCallback((permission: keyof Omit<Permissions, "fieldPermissions">) => {
    return permissions?.[permission] ?? false;
  }, [permissions]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    permissions,
    login,
    logout,
    hasPermission,
  }), [user, isLoading, error, permissions, login, logout, hasPermission]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check permissions
 */
export function usePermissions() {
  const { permissions, hasPermission } = useAuth();
  return { permissions, hasPermission, canEdit: hasPermission("canEdit"), canPublish: hasPermission("canPublish") };
}

/**
 * LoginForm component props
 */
export interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Login form component
 */
export function LoginForm({ onSuccess, className = "", style }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    onSuccess?.();
  };

  const formStyles: CSSProperties = { display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", ...style };
  const inputStyles: CSSProperties = { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" };
  const buttonStyles: CSSProperties = { padding: "10px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: isLoading ? "not-allowed" : "pointer" };

  return (
    <form className={className} style={formStyles} onSubmit={handleSubmit}>
      {error && <div style={{ color: "#dc2626", padding: "8px", backgroundColor: "#fee2e2", borderRadius: "4px" }}>{error}</div>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputStyles} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyles} />
      <button type="submit" disabled={isLoading} style={buttonStyles}>{isLoading ? "Logging in..." : "Log In"}</button>
    </form>
  );
}

/**
 * Protected route component
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof Omit<Permissions, "fieldPermissions">;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredPermission, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) return <>{fallback || null}</>;
  if (requiredPermission && !hasPermission(requiredPermission)) return <>{fallback || null}</>;

  return <>{children}</>;
}
