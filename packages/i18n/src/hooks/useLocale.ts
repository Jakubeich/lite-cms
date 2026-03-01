"use client";

import { useCallback } from "react";
import { useI18nContext } from "../context/I18nContext";

/**
 * useLocale return type
 */
export interface UseLocaleReturn {
  /** Current locale */
  locale: string;
  /** Available locales */
  locales: string[];
  /** Default locale */
  defaultLocale: string;
  /** Set locale */
  setLocale: (locale: string) => void;
  /** Check if current locale is default */
  isDefaultLocale: boolean;
  /** Get locale display name */
  getLocaleName: (locale: string) => string;
}

/**
 * Locale display names
 */
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  cs: "Čeština",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pl: "Polski",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  nl: "Nederlands",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  no: "Norsk",
  uk: "Українська",
  sk: "Slovenčina",
  hu: "Magyar",
  ro: "Română",
  bg: "Български",
  hr: "Hrvatski",
  sl: "Slovenščina",
  et: "Eesti",
  lv: "Latviešu",
  lt: "Lietuvių",
};

/**
 * Hook for managing locale
 */
export function useLocale(): UseLocaleReturn {
  const { locale, locales, defaultLocale, setLocale } = useI18nContext();

  const getLocaleName = useCallback(
    (loc: string) => LOCALE_NAMES[loc] || loc.toUpperCase(),
    []
  );

  return {
    locale,
    locales,
    defaultLocale,
    setLocale,
    isDefaultLocale: locale === defaultLocale,
    getLocaleName,
  };
}
