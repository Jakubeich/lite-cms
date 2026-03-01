"use client";

import React, { CSSProperties } from "react";
import { useLocale } from "../hooks/useLocale";

/**
 * LocaleSwitch props
 */
export interface LocaleSwitchProps {
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Show locale names instead of codes */
  showNames?: boolean;
  /** Render as dropdown or buttons */
  variant?: "dropdown" | "buttons" | "flags";
}

/**
 * Locale switch component
 */
export function LocaleSwitch({
  className = "",
  style,
  showNames = false,
  variant = "dropdown",
}: LocaleSwitchProps) {
  const { locale, locales, setLocale, getLocaleName } = useLocale();

  if (variant === "buttons") {
    const buttonContainerStyles: CSSProperties = {
      display: "flex",
      gap: "4px",
      ...style,
    };

    const buttonStyles = (isActive: boolean): CSSProperties => ({
      padding: "6px 12px",
      border: "1px solid",
      borderColor: isActive ? "#3b82f6" : "#e5e7eb",
      borderRadius: "4px",
      backgroundColor: isActive ? "#3b82f6" : "transparent",
      color: isActive ? "white" : "#374151",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: isActive ? 500 : 400,
      transition: "all 0.15s ease",
    });

    return (
      <div className={className} style={buttonContainerStyles}>
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            style={buttonStyles(loc === locale)}
            onClick={() => setLocale(loc)}
          >
            {showNames ? getLocaleName(loc) : loc.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  const selectStyles: CSSProperties = {
    padding: "8px 12px",
    paddingRight: "32px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "white",
    color: "#374151",
    fontSize: "14px",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    ...style,
  };

  return (
    <select
      className={className}
      style={selectStyles}
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {showNames ? getLocaleName(loc) : loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
