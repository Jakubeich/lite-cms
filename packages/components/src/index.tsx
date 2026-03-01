"use client";

import React, { CSSProperties } from "react";
import type { EditableSectionProps, EditableHeroProps, EditableFeaturesProps, FeatureItem } from "@litecms/core";

// Re-export types
export type {
  EditableSectionProps,
  EditableHeroProps,
  FeatureItem,
  EditableFeaturesProps,
  TestimonialItem,
  EditableTestimonialsProps,
  GalleryItem,
  EditableGalleryProps,
} from "@litecms/core";

/**
 * EditableHero component
 * A pre-built hero section with editable title, subtitle, and CTA
 */
export interface EditableHeroComponentProps extends EditableHeroProps {
  /** Render function for editable text */
  renderEditable: (field: string, defaultValue: string, as?: string) => React.ReactNode;
  /** Render function for editable image */
  renderImage?: (field: string) => React.ReactNode;
}

export function EditableHero({
  prefix = "hero",
  defaultTitle = "Welcome to Our Site",
  defaultSubtitle = "Discover amazing features and possibilities",
  defaultCTA = "Get Started",
  layout = "centered",
  className = "",
  id,
  renderEditable,
  renderImage,
}: EditableHeroComponentProps) {
  const containerStyles: CSSProperties = {
    minHeight: "60vh",
    display: "flex",
    flexDirection: layout === "split" ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: layout === "left" ? "left" : "center",
    padding: "64px 24px",
    position: "relative",
  };

  const contentStyles: CSSProperties = {
    maxWidth: "800px",
    zIndex: 1,
  };

  const titleStyles: CSSProperties = {
    fontSize: "clamp(32px, 5vw, 64px)",
    fontWeight: 700,
    marginBottom: "16px",
    lineHeight: 1.2,
  };

  const subtitleStyles: CSSProperties = {
    fontSize: "clamp(16px, 2vw, 20px)",
    color: "#6b7280",
    marginBottom: "32px",
    lineHeight: 1.6,
  };

  const ctaStyles: CSSProperties = {
    display: "inline-block",
    padding: "12px 32px",
    backgroundColor: "#3b82f6",
    color: "white",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 500,
    textDecoration: "none",
  };

  return (
    <section id={id} className={className} style={containerStyles}>
      {renderImage && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.1 }}>
          {renderImage(`${prefix}.background`)}
        </div>
      )}
      <div style={contentStyles}>
        <h1 style={titleStyles}>{renderEditable(`${prefix}.title`, defaultTitle, "span")}</h1>
        <p style={subtitleStyles}>{renderEditable(`${prefix}.subtitle`, defaultSubtitle, "span")}</p>
        <a href="#" style={ctaStyles}>{renderEditable(`${prefix}.cta`, defaultCTA, "span")}</a>
      </div>
    </section>
  );
}

/**
 * EditableFeatures component
 * A pre-built features grid section
 */
export interface EditableFeaturesComponentProps extends EditableFeaturesProps {
  renderEditable: (field: string, defaultValue: string, as?: string) => React.ReactNode;
}

export function EditableFeatures({
  prefix = "features",
  defaultFeatures = [
    { icon: "star", title: "Feature 1", description: "Description of feature 1" },
    { icon: "bolt", title: "Feature 2", description: "Description of feature 2" },
    { icon: "heart", title: "Feature 3", description: "Description of feature 3" },
  ],
  columns = 3,
  layout = "grid",
  className = "",
  id,
  renderEditable,
}: EditableFeaturesComponentProps) {
  const containerStyles: CSSProperties = {
    padding: "64px 24px",
  };

  const gridStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const cardStyles: CSSProperties = {
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    textAlign: "center",
  };

  const iconStyles: CSSProperties = {
    width: "48px",
    height: "48px",
    backgroundColor: "#3b82f6",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    color: "white",
    fontSize: "24px",
  };

  return (
    <section id={id} className={className} style={containerStyles}>
      <div style={gridStyles}>
        {defaultFeatures.map((feature, index) => (
          <div key={index} style={cardStyles}>
            <div style={iconStyles}>{feature.icon?.charAt(0).toUpperCase() || "F"}</div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
              {renderEditable(`${prefix}.${index}.title`, feature.title, "span")}
            </h3>
            <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
              {renderEditable(`${prefix}.${index}.description`, feature.description, "span")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * EditableNavbar component
 */
export interface EditableNavbarProps {
  prefix?: string;
  className?: string;
  renderEditable: (field: string, defaultValue: string, as?: string) => React.ReactNode;
  links?: Array<{ label: string; href: string }>;
}

export function EditableNavbar({
  prefix = "nav",
  className = "",
  renderEditable,
  links = [
    { label: "Home", href: "#" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
}: EditableNavbarProps) {
  const navStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
  };

  const logoStyles: CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
  };

  const linksStyles: CSSProperties = {
    display: "flex",
    gap: "24px",
  };

  const linkStyles: CSSProperties = {
    color: "#6b7280",
    textDecoration: "none",
    fontSize: "14px",
  };

  return (
    <nav className={className} style={navStyles}>
      <div style={logoStyles}>{renderEditable(`${prefix}.logo`, "Logo", "span")}</div>
      <div style={linksStyles}>
        {links.map((link, i) => (
          <a key={i} href={link.href} style={linkStyles}>
            {renderEditable(`${prefix}.link.${i}`, link.label, "span")}
          </a>
        ))}
      </div>
    </nav>
  );
}

/**
 * EditableFooter component
 */
export interface EditableFooterProps {
  prefix?: string;
  className?: string;
  renderEditable: (field: string, defaultValue: string, as?: string) => React.ReactNode;
}

export function EditableFooter({
  prefix = "footer",
  className = "",
  renderEditable,
}: EditableFooterProps) {
  const footerStyles: CSSProperties = {
    padding: "48px 24px",
    backgroundColor: "#1f2937",
    color: "white",
    textAlign: "center",
  };

  const textStyles: CSSProperties = {
    color: "#9ca3af",
    fontSize: "14px",
  };

  return (
    <footer className={className} style={footerStyles}>
      <p style={{ marginBottom: "16px" }}>{renderEditable(`${prefix}.tagline`, "Built with LiteCMS", "span")}</p>
      <p style={textStyles}>{renderEditable(`${prefix}.copyright`, "© 2024 All rights reserved.", "span")}</p>
    </footer>
  );
}
