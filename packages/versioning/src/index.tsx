"use client";

import React, { useState, useCallback, CSSProperties } from "react";
import type { ContentVersion, DiffResult, VersioningAdapter } from "@litecms/core";

// Re-export types
export type { ContentVersion, VersionedContentData, DiffResult, VersioningAdapter } from "@litecms/core";

/**
 * useVersions hook options
 */
export interface UseVersionsOptions {
  /** Versioning adapter */
  adapter: VersioningAdapter;
  /** Field to manage versions for */
  field: string;
}

/**
 * useVersions hook return type
 */
export interface UseVersionsReturn {
  versions: ContentVersion[];
  isLoading: boolean;
  error: string | null;
  currentVersion: number;
  loadVersions: () => Promise<void>;
  restore: (version: number) => Promise<void>;
  compare: (v1: number, v2: number) => Promise<DiffResult[]>;
}

/**
 * Hook for managing content versions
 */
export function useVersions({ adapter, field }: UseVersionsOptions): UseVersionsReturn {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState(0);

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [versionList, latest] = await Promise.all([
        adapter.getVersions(field),
        adapter.getLatestVersion(field),
      ]);
      setVersions(versionList);
      setCurrentVersion(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  }, [adapter, field]);

  const restore = useCallback(async (version: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await adapter.restore(field, version);
      await loadVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setIsLoading(false);
    }
  }, [adapter, field, loadVersions]);

  const compare = useCallback(async (v1: number, v2: number): Promise<DiffResult[]> => {
    return adapter.compare(field, v1, v2);
  }, [adapter, field]);

  return { versions, isLoading, error, currentVersion, loadVersions, restore, compare };
}

/**
 * VersionHistory component props
 */
export interface VersionHistoryProps {
  versions: ContentVersion[];
  currentVersion: number;
  onRestore: (version: number) => void;
  onCompare?: (v1: number, v2: number) => void;
  isLoading?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Version history panel component
 */
export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onCompare,
  isLoading = false,
  className = "",
  style,
}: VersionHistoryProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const handleSelect = (version: number) => {
    setSelected((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  const containerStyles: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    ...style,
  };

  const headerStyles: CSSProperties = {
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
  };

  const itemStyles = (isSelected: boolean, isCurrent: boolean): CSSProperties => ({
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isSelected ? "#eff6ff" : isCurrent ? "#f0fdf4" : "white",
    cursor: "pointer",
  });

  if (isLoading) {
    return <div className={className} style={{ ...containerStyles, padding: "24px", textAlign: "center" }}>Loading versions...</div>;
  }

  if (versions.length === 0) {
    return <div className={className} style={{ ...containerStyles, padding: "24px", textAlign: "center", color: "#6b7280" }}>No version history</div>;
  }

  return (
    <div className={className} style={containerStyles}>
      <div style={headerStyles}>
        Version History ({versions.length})
        {selected.length === 2 && onCompare && (
          <button
            onClick={() => onCompare(selected[0], selected[1])}
            style={{ marginLeft: "12px", padding: "4px 8px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Compare
          </button>
        )}
      </div>
      <div style={{ maxHeight: "300px", overflow: "auto" }}>
        {versions.map((v) => (
          <div
            key={v.id}
            style={itemStyles(selected.includes(v.version), v.version === currentVersion)}
            onClick={() => handleSelect(v.version)}
          >
            <div>
              <div style={{ fontWeight: 500 }}>Version {v.version}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {new Date(v.createdAt).toLocaleString()}
                {v.createdBy && ` by ${v.createdBy}`}
              </div>
              {v.message && <div style={{ fontSize: "12px", marginTop: "4px" }}>{v.message}</div>}
            </div>
            {v.version !== currentVersion && (
              <button
                onClick={(e) => { e.stopPropagation(); onRestore(v.version); }}
                style={{ padding: "4px 8px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Restore
              </button>
            )}
            {v.version === currentVersion && (
              <span style={{ padding: "4px 8px", backgroundColor: "#dcfce7", color: "#16a34a", borderRadius: "4px", fontSize: "12px" }}>Current</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * VersionDiff component props
 */
export interface VersionDiffProps {
  diff: DiffResult[];
  className?: string;
  style?: CSSProperties;
}

/**
 * Version diff display component
 */
export function VersionDiff({ diff, className = "", style }: VersionDiffProps) {
  const containerStyles: CSSProperties = {
    fontFamily: "monospace",
    fontSize: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    ...style,
  };

  const getLineStyle = (type: DiffResult["type"]): CSSProperties => ({
    padding: "4px 12px",
    backgroundColor: type === "added" ? "#dcfce7" : type === "removed" ? "#fee2e2" : "white",
    color: type === "added" ? "#16a34a" : type === "removed" ? "#dc2626" : "#374151",
    borderBottom: "1px solid #f3f4f6",
  });

  return (
    <div className={className} style={containerStyles}>
      {diff.map((d, i) => (
        <div key={i} style={getLineStyle(d.type)}>
          {d.type === "added" && "+ "}
          {d.type === "removed" && "- "}
          {d.value}
        </div>
      ))}
    </div>
  );
}
