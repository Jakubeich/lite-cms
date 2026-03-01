"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import type { I18nConfig } from "@litecms/core";

/**
 * I18n context value
 */
export interface I18nContextValue {
  /** Current locale */
  locale: string;
  /** Available locales */
  locales: string[];
  /** Default locale */
  defaultLocale: string;
  /** Fallback locale */
  fallbackLocale: string;
  /** Set current locale */
  setLocale: (locale: string) => void;
  /** Check if locale is supported */
  isSupported: (locale: string) => boolean;
  /** Get localized field key */
  getLocalizedField: (field: string, targetLocale?: string) => string;
}

/**
 * I18n context
 */
const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * I18n provider props
 */
export interface I18nProviderProps {
  children: ReactNode;
  /** I18n configuration */
  config?: I18nConfig;
  /** Initial locale */
  initialLocale?: string;
  /** Callback when locale changes */
  onLocaleChange?: (locale: string) => void;
}

/**
 * Default I18n configuration
 */
const DEFAULT_CONFIG: I18nConfig = {
  defaultLocale: "en",
  locales: ["en"],
  fallbackLocale: "en",
};

/**
 * I18n provider component
 */
export function I18nProvider({
  children,
  config = DEFAULT_CONFIG,
  initialLocale,
  onLocaleChange,
}: I18nProviderProps) {
  const { defaultLocale, locales, fallbackLocale } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [locale, setLocaleState] = useState(initialLocale || defaultLocale);

  // Set locale with validation
  const setLocale = useCallback(
    (newLocale: string) => {
      if (locales.includes(newLocale)) {
        setLocaleState(newLocale);
        onLocaleChange?.(newLocale);
      } else {
        console.warn(`Locale "${newLocale}" is not supported. Using "${fallbackLocale}".`);
        setLocaleState(fallbackLocale || defaultLocale);
      }
    },
    [locales, fallbackLocale, defaultLocale, onLocaleChange]
  );

  // Check if locale is supported
  const isSupported = useCallback(
    (checkLocale: string) => locales.includes(checkLocale),
    [locales]
  );

  // Get localized field key
  const getLocalizedField = useCallback(
    (field: string, targetLocale?: string) => {
      const loc = targetLocale || locale;
      // Convention: field.locale (e.g., "hero.title.en")
      return `${field}.${loc}`;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      locales,
      defaultLocale,
      fallbackLocale: fallbackLocale || defaultLocale,
      setLocale,
      isSupported,
      getLocalizedField,
    }),
    [locale, locales, defaultLocale, fallbackLocale, setLocale, isSupported, getLocalizedField]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access I18n context
 */
export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18nContext must be used within an I18nProvider");
  }
  return context;
}
