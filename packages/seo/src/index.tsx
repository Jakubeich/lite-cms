"use client";

import React, { useState, useCallback, CSSProperties } from "react";
import type { SEOData, PageSEO } from "@litecms/core";

// Re-export types
export type { SEOData, PageSEO } from "@litecms/core";

/**
 * Default SEO data
 */
export const DEFAULT_SEO: SEOData = {
  title: "",
  description: "",
  keywords: [],
  robots: { index: true, follow: true },
  openGraph: { type: "website" },
  twitter: { card: "summary_large_image" },
};

/**
 * useSEO hook options
 */
export interface UseSEOOptions {
  pageId: string;
  initialData?: SEOData;
  onSave?: (data: SEOData) => Promise<void>;
}

/**
 * useSEO hook return type
 */
export interface UseSEOReturn {
  seo: SEOData;
  updateSEO: (data: Partial<SEOData>) => void;
  save: () => Promise<void>;
  reset: () => void;
  isModified: boolean;
  isSaving: boolean;
}

/**
 * Hook for managing SEO data
 */
export function useSEO({ pageId, initialData = DEFAULT_SEO, onSave }: UseSEOOptions): UseSEOReturn {
  const [seo, setSEO] = useState<SEOData>({ ...DEFAULT_SEO, ...initialData });
  const [originalSEO] = useState<SEOData>({ ...DEFAULT_SEO, ...initialData });
  const [isSaving, setIsSaving] = useState(false);

  const updateSEO = useCallback((data: Partial<SEOData>) => {
    setSEO((prev) => ({ ...prev, ...data }));
  }, []);

  const save = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(seo);
    } finally {
      setIsSaving(false);
    }
  }, [seo, onSave]);

  const reset = useCallback(() => {
    setSEO(originalSEO);
  }, [originalSEO]);

  const isModified = JSON.stringify(seo) !== JSON.stringify(originalSEO);

  return { seo, updateSEO, save, reset, isModified, isSaving };
}

/**
 * SEOEditor component props
 */
export interface SEOEditorProps {
  seo: SEOData;
  onChange: (data: Partial<SEOData>) => void;
  onSave?: () => void;
  isSaving?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * SEO editor panel component
 */
export function SEOEditor({ seo, onChange, onSave, isSaving, className = "", style }: SEOEditorProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "social" | "advanced">("basic");

  const containerStyles: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    ...style,
  };

  const tabStyles = (isActive: boolean): CSSProperties => ({
    padding: "12px 16px",
    border: "none",
    backgroundColor: isActive ? "white" : "#f9fafb",
    borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isActive ? 500 : 400,
  });

  const inputStyles: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  };

  const labelStyles: CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  };

  const fieldStyles: CSSProperties = { marginBottom: "16px" };

  return (
    <div className={className} style={containerStyles}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
        <button style={tabStyles(activeTab === "basic")} onClick={() => setActiveTab("basic")}>Basic</button>
        <button style={tabStyles(activeTab === "social")} onClick={() => setActiveTab("social")}>Social</button>
        <button style={tabStyles(activeTab === "advanced")} onClick={() => setActiveTab("advanced")}>Advanced</button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Basic Tab */}
        {activeTab === "basic" && (
          <>
            <div style={fieldStyles}>
              <label style={labelStyles}>Title</label>
              <input
                style={inputStyles}
                value={seo.title || ""}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Page title"
                maxLength={60}
              />
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{(seo.title?.length || 0)}/60 characters</div>
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Description</label>
              <textarea
                style={{ ...inputStyles, minHeight: "80px" }}
                value={seo.description || ""}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Meta description"
                maxLength={160}
              />
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{(seo.description?.length || 0)}/160 characters</div>
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>Keywords</label>
              <input
                style={inputStyles}
                value={(seo.keywords || []).join(", ")}
                onChange={(e) => onChange({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </>
        )}

        {/* Social Tab */}
        {activeTab === "social" && (
          <>
            <div style={fieldStyles}>
              <label style={labelStyles}>OG Title</label>
              <input
                style={inputStyles}
                value={seo.openGraph?.title || ""}
                onChange={(e) => onChange({ openGraph: { ...seo.openGraph, title: e.target.value } })}
                placeholder="Open Graph title"
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>OG Description</label>
              <textarea
                style={{ ...inputStyles, minHeight: "80px" }}
                value={seo.openGraph?.description || ""}
                onChange={(e) => onChange({ openGraph: { ...seo.openGraph, description: e.target.value } })}
                placeholder="Open Graph description"
              />
            </div>
            <div style={fieldStyles}>
              <label style={labelStyles}>OG Image URL</label>
              <input
                style={inputStyles}
                value={seo.openGraph?.image || ""}
                onChange={(e) => onChange({ openGraph: { ...seo.openGraph, image: e.target.value } })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        )}

        {/* Advanced Tab */}
        {activeTab === "advanced" && (
          <>
            <div style={fieldStyles}>
              <label style={labelStyles}>Canonical URL</label>
              <input
                style={inputStyles}
                value={seo.canonical || ""}
                onChange={(e) => onChange({ canonical: e.target.value })}
                placeholder="https://example.com/page"
              />
            </div>
            <div style={{ ...fieldStyles, display: "flex", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={seo.robots?.index !== false}
                  onChange={(e) => onChange({ robots: { ...seo.robots, index: e.target.checked } })}
                />
                Index
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={seo.robots?.follow !== false}
                  onChange={(e) => onChange({ robots: { ...seo.robots, follow: e.target.checked } })}
                />
                Follow
              </label>
            </div>
          </>
        )}

        {/* Save button */}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{
              width: "100%",
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#3b82f6",
              color: "white",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {isSaving ? "Saving..." : "Save SEO Settings"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Generate meta tags from SEO data
 */
export function generateMetaTags(seo: SEOData): Array<{ name?: string; property?: string; content: string }> {
  const tags: Array<{ name?: string; property?: string; content: string }> = [];

  if (seo.description) tags.push({ name: "description", content: seo.description });
  if (seo.keywords?.length) tags.push({ name: "keywords", content: seo.keywords.join(", ") });

  if (seo.robots) {
    const robotsContent = [
      seo.robots.index !== false ? "index" : "noindex",
      seo.robots.follow !== false ? "follow" : "nofollow",
    ].join(", ");
    tags.push({ name: "robots", content: robotsContent });
  }

  if (seo.openGraph) {
    if (seo.openGraph.title) tags.push({ property: "og:title", content: seo.openGraph.title });
    if (seo.openGraph.description) tags.push({ property: "og:description", content: seo.openGraph.description });
    if (seo.openGraph.image) tags.push({ property: "og:image", content: seo.openGraph.image });
    if (seo.openGraph.type) tags.push({ property: "og:type", content: seo.openGraph.type });
  }

  if (seo.twitter) {
    if (seo.twitter.card) tags.push({ name: "twitter:card", content: seo.twitter.card });
    if (seo.twitter.site) tags.push({ name: "twitter:site", content: seo.twitter.site });
  }

  return tags;
}
