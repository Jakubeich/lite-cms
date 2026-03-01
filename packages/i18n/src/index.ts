// Re-export types from core
export type {
  I18nConfig,
  LocalizedContent,
  LocalizedContentData,
} from "@litecms/core";

// Context
export { I18nProvider, useI18nContext } from "./context/I18nContext";
export type { I18nProviderProps, I18nContextValue } from "./context/I18nContext";

// Hooks
export { useLocale } from "./hooks/useLocale";
export type { UseLocaleReturn } from "./hooks/useLocale";

export { useLocalizedContent } from "./hooks/useLocalizedContent";
export type {
  UseLocalizedContentOptions,
  UseLocalizedContentReturn,
  LocalizedValue,
} from "./hooks/useLocalizedContent";

// Components
export { LocaleSwitch } from "./components/LocaleSwitch";
export type { LocaleSwitchProps } from "./components/LocaleSwitch";

export { LocalizedEditable } from "./components/LocalizedEditable";
export type { LocalizedEditableProps } from "./components/LocalizedEditable";
