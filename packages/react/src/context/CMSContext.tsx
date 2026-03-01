"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  CMSConfig,
  CMSState,
  CMSAction,
  AuthState,
  ContentData,
  StorageAdapter,
} from "@litecms/core";

interface CMSContextValue {
  state: CMSState;
  auth: AuthState;
  config: CMSConfig;
  updateContent: (field: string, value: string) => Promise<void>;
  deleteContent: (field: string) => Promise<void>;
  setEditMode: (enabled: boolean) => void;
  getContent: (field: string) => string | null;
}

const CMSContext = createContext<CMSContextValue | null>(null);

const initialState: CMSState = {
  content: {},
  isLoading: true,
  error: null,
  isEditMode: false,
};

function cmsReducer(state: CMSState, action: CMSAction): CMSState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload, isLoading: false };
    case "UPDATE_CONTENT":
      return {
        ...state,
        content: {
          ...state.content,
          [action.payload.field]: action.payload,
        },
      };
    case "DELETE_CONTENT": {
      const { [action.payload]: _, ...rest } = state.content;
      return { ...state, content: rest };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_EDIT_MODE":
      return { ...state, isEditMode: action.payload };
    default:
      return state;
  }
}

/**
 * API-based storage adapter for client-side use
 */
function createApiAdapter(apiUrl: string): StorageAdapter {
  return {
    async get(field: string): Promise<ContentData | null> {
      const res = await fetch(`${apiUrl}?field=${encodeURIComponent(field)}`);
      if (!res.ok) return null;
      return res.json();
    },
    async getAll(): Promise<Record<string, ContentData>> {
      const res = await fetch(apiUrl);
      if (!res.ok) return {};
      return res.json();
    },
    async set(field: string, value: string): Promise<ContentData> {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (!res.ok) throw new Error("Failed to save content");
      return res.json();
    },
    async delete(field: string): Promise<void> {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      if (!res.ok) throw new Error("Failed to delete content");
    },
  };
}

interface LiteCMSProviderProps {
  children: ReactNode;
  config: CMSConfig;
  auth?: AuthState;
}

export function LiteCMSProvider({
  children,
  config,
  auth = { isAdmin: false },
}: LiteCMSProviderProps) {
  const [state, dispatch] = useReducer(cmsReducer, initialState);

  const adapter: StorageAdapter | null =
    config.adapter || (config.apiUrl ? createApiAdapter(config.apiUrl) : null);

  // Load initial content
  useEffect(() => {
    if (!adapter) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    adapter
      .getAll()
      .then((content) => {
        dispatch({ type: "SET_CONTENT", payload: content });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", payload: err.message });
      });
  }, [adapter]);

  const updateContent = useCallback(
    async (field: string, value: string) => {
      if (!adapter) {
        console.warn("LiteCMS: No storage adapter configured");
        return;
      }

      try {
        const data = await adapter.set(field, value);
        dispatch({ type: "UPDATE_CONTENT", payload: data });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [adapter]
  );

  const deleteContent = useCallback(
    async (field: string) => {
      if (!adapter) return;

      try {
        await adapter.delete(field);
        dispatch({ type: "DELETE_CONTENT", payload: field });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [adapter]
  );

  const setEditMode = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_EDIT_MODE", payload: enabled });
  }, []);

  const getContent = useCallback(
    (field: string): string | null => {
      return state.content[field]?.value ?? null;
    },
    [state.content]
  );

  return (
    <CMSContext.Provider
      value={{
        state,
        auth,
        config,
        updateContent,
        deleteContent,
        setEditMode,
        getContent,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMSContext(): CMSContextValue {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMSContext must be used within a LiteCMSProvider");
  }
  return context;
}
