"use client";

import { useCallback, useMemo } from "react";
import { useI18nContext } from "../context/I18nContext";

/**
 * Localized content value
 */
export interface LocalizedValue {
  /** Value for current locale */
  value: string | null;
  /** All translations */
  translations: Record<string, string>;
  /** Whether translation exists for current locale */
  hasTranslation: boolean;
  /** Whether using fallback */
  isFallback: boolean;
}

/**
 * useLocalizedContent options
 */
export interface UseLocalizedContentOptions {
  /** Get content value by field */
  getContent: (field: string) => string | null;
  /** Update content value */
  updateContent?: (field: string, value: string) => Promise<void>;
}

/**
 * useLocalizedContent return type
 */
export interface UseLocalizedContentReturn {
  /** Get localized value for a field */
  getLocalizedValue: (field: string) => LocalizedValue;
  /** Get value for specific locale */
  getValueForLocale: (field: string, locale: string) => string | null;
  /** Update value for current locale */
  updateLocalizedValue: (field: string, value: string) => Promise<void>;
  /** Update value for specific locale */
  updateValueForLocale: (field: string, locale: string, value: string) => Promise<void>;
  /** Get all translations for a field */
  getTranslations: (field: string) => Record<string, string>;
  /** Check if field has translation for locale */
  hasTranslation: (field: string, locale?: string) => boolean;
}

/**
 * Hook for managing localized content
 */
export function useLocalizedContent(
  options: UseLocalizedContentOptions
): UseLocalizedContentReturn {
  const { getContent, updateContent } = options;
  const { locale, locales, fallbackLocale, getLocalizedField } = useI18nContext();

  // Get value for specific locale
  const getValueForLocale = useCallback(
    (field: string, targetLocale: string): string | null => {
      const localizedField = getLocalizedField(field, targetLocale);
      return getContent(localizedField);
    },
    [getContent, getLocalizedField]
  );

  // Get all translations for a field
  const getTranslations = useCallback(
    (field: string): Record<string, string> => {
      const translations: Record<string, string> = {};
      for (const loc of locales) {
        const value = getValueForLocale(field, loc);
        if (value !== null) {
          translations[loc] = value;
        }
      }
      return translations;
    },
    [locales, getValueForLocale]
  );

  // Get localized value with fallback
  const getLocalizedValue = useCallback(
    (field: string): LocalizedValue => {
      const translations = getTranslations(field);

      // Try current locale
      let value = translations[locale] ?? null;
      let isFallback = false;

      // Fallback to fallback locale
      if (value === null && fallbackLocale && fallbackLocale !== locale) {
        value = translations[fallbackLocale] ?? null;
        isFallback = value !== null;
      }

      return {
        value,
        translations,
        hasTranslation: translations[locale] !== undefined,
        isFallback,
      };
    },
    [locale, fallbackLocale, getTranslations]
  );

  // Update value for current locale
  const updateLocalizedValue = useCallback(
    async (field: string, value: string): Promise<void> => {
      if (!updateContent) return;
      const localizedField = getLocalizedField(field);
      await updateContent(localizedField, value);
    },
    [updateContent, getLocalizedField]
  );

  // Update value for specific locale
  const updateValueForLocale = useCallback(
    async (field: string, targetLocale: string, value: string): Promise<void> => {
      if (!updateContent) return;
      const localizedField = getLocalizedField(field, targetLocale);
      await updateContent(localizedField, value);
    },
    [updateContent, getLocalizedField]
  );

  // Check if translation exists
  const hasTranslation = useCallback(
    (field: string, targetLocale?: string): boolean => {
      const loc = targetLocale || locale;
      const value = getValueForLocale(field, loc);
      return value !== null;
    },
    [locale, getValueForLocale]
  );

  return {
    getLocalizedValue,
    getValueForLocale,
    updateLocalizedValue,
    updateValueForLocale,
    getTranslations,
    hasTranslation,
  };
}
