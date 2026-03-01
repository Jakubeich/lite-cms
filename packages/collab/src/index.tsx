"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, CSSProperties } from "react";
import type { Presence, CollaborationAdapter, User } from "@litecms/core";
import { generateColor } from "@litecms/core";

// Re-export types
export type { Presence, CollabEvent, CollabEventType, CollaborationAdapter } from "@litecms/core";

/**
 * Collaboration context value
 */
export interface CollabContextValue {
  isConnected: boolean;
  presence: Presence[];
  currentUser: Presence | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateCursor: (field: string, position: number) => void;
  updateSelection: (field: string, start: number, end: number) => void;
}

const CollabContext = createContext<CollabContextValue | null>(null);

/**
 * CollabProvider props
 */
export interface CollabProviderProps {
  children: ReactNode;
  adapter: CollaborationAdapter;
  user: User;
}

/**
 * Collaboration provider component
 */
export function CollabProvider({ children, adapter, user }: CollabProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [currentUser, setCurrentUser] = useState<Presence | null>(null);

  const connect = useCallback(async () => {
    await adapter.connect();
    setIsConnected(true);
    const currentPresence: Presence = {
      id: user.id,
      user,
      color: generateColor(),
      lastSeen: Date.now(),
      isActive: true,
    };
    setCurrentUser(currentPresence);
    await adapter.updatePresence(currentPresence);
    const allPresence = await adapter.getPresence();
    setPresence(allPresence);
  }, [adapter, user]);

  const disconnect = useCallback(async () => {
    await adapter.disconnect();
    setIsConnected(false);
    setCurrentUser(null);
  }, [adapter]);

  const updateCursor = useCallback(async (field: string, position: number) => {
    if (!isConnected || !currentUser) return;
    await adapter.updatePresence({
      cursor: { field, position },
      lastSeen: Date.now(),
    });
  }, [adapter, isConnected, currentUser]);

  const updateSelection = useCallback(async (field: string, start: number, end: number) => {
    if (!isConnected || !currentUser) return;
    await adapter.updatePresence({
      selection: { field, start, end },
      lastSeen: Date.now(),
    });
  }, [adapter, isConnected, currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) disconnect();
    };
  }, [isConnected, disconnect]);

  const value = useMemo<CollabContextValue>(() => ({
    isConnected,
    presence,
    currentUser,
    connect,
    disconnect,
    updateCursor,
    updateSelection,
  }), [isConnected, presence, currentUser, connect, disconnect, updateCursor, updateSelection]);

  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>;
}

/**
 * Hook to access collaboration context
 */
export function useCollab(): CollabContextValue {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within a CollabProvider");
  }
  return context;
}

/**
 * PresenceList component props
 */
export interface PresenceListProps {
  className?: string;
  style?: CSSProperties;
  maxAvatars?: number;
}

/**
 * Presence list component showing active users
 */
export function PresenceList({ className = "", style, maxAvatars = 5 }: PresenceListProps) {
  const { presence, currentUser } = useCollab();

  const otherUsers = presence.filter((p) => p.id !== currentUser?.id && p.isActive);
  const visibleUsers = otherUsers.slice(0, maxAvatars);
  const remainingCount = Math.max(0, otherUsers.length - maxAvatars);

  const containerStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    ...style,
  };

  const avatarStyles = (color: string, index: number): CSSProperties => ({
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: color,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 500,
    border: "2px solid white",
    marginLeft: index > 0 ? "-8px" : 0,
    position: "relative",
    zIndex: maxAvatars - index,
  });

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className={className} style={containerStyles}>
      {visibleUsers.map((p, i) => (
        <div key={p.id} style={avatarStyles(p.color, i)} title={p.user.name || p.user.email}>
          {p.user.avatar ? (
            <img src={p.user.avatar} alt={p.user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            getInitials(p.user.name)
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div style={{ ...avatarStyles("#6b7280", visibleUsers.length), backgroundColor: "#e5e7eb", color: "#374151" }}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * Cursor component props
 */
export interface CursorProps {
  presence: Presence;
  className?: string;
}

/**
 * Remote cursor component
 */
export function Cursor({ presence, className = "" }: CursorProps) {
  if (!presence.cursor) return null;

  const cursorStyles: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 9999,
  };

  const labelStyles: CSSProperties = {
    position: "absolute",
    top: "-20px",
    left: 0,
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: presence.color,
    color: "white",
    fontSize: "10px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  };

  return (
    <div className={className} style={cursorStyles}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill={presence.color}>
        <path d="M0 0L16 6L8 8L6 16L0 0Z" />
      </svg>
      <div style={labelStyles}>{presence.user.name || presence.user.email}</div>
    </div>
  );
}
