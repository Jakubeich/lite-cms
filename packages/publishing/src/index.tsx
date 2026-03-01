"use client";

import React, { useState, useCallback, CSSProperties } from "react";
import type { PublishStatus, PublishableContent, PublishingAdapter } from "@litecms/core";

// Re-export types
export type { PublishStatus, PublishableContent, PublishingAdapter } from "@litecms/core";

/**
 * usePublishing hook options
 */
export interface UsePublishingOptions {
  adapter: PublishingAdapter;
  field: string;
  initialStatus?: PublishStatus;
}

/**
 * usePublishing hook return type
 */
export interface UsePublishingReturn {
  status: PublishStatus;
  isLoading: boolean;
  error: string | null;
  scheduledAt: string | null;
  publish: () => Promise<void>;
  unpublish: () => Promise<void>;
  schedule: (date: Date) => Promise<void>;
  cancelSchedule: () => Promise<void>;
  saveDraft: (value: string) => Promise<void>;
  archive: () => Promise<void>;
}

/**
 * Hook for managing content publishing
 */
export function usePublishing({ adapter, field, initialStatus = "draft" }: UsePublishingOptions): UsePublishingReturn {
  const [status, setStatus] = useState<PublishStatus>(initialStatus);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(async (action: () => Promise<PublishableContent>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action();
      setStatus(result.status);
      setScheduledAt(result.scheduledAt || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    scheduledAt,
    publish: () => handleAction(() => adapter.publish(field)),
    unpublish: () => handleAction(() => adapter.unpublish(field)),
    schedule: (date: Date) => handleAction(() => adapter.schedule(field, date)),
    cancelSchedule: () => handleAction(() => adapter.cancelSchedule(field)),
    saveDraft: (value: string) => handleAction(() => adapter.saveDraft(field, value)),
    archive: () => handleAction(() => adapter.archive(field)),
  };
}

/**
 * StatusBadge component props
 */
export interface StatusBadgeProps {
  status: PublishStatus;
  className?: string;
  style?: CSSProperties;
}

/**
 * Status badge component
 */
export function StatusBadge({ status, className = "", style }: StatusBadgeProps) {
  const colors: Record<PublishStatus, { bg: string; text: string }> = {
    draft: { bg: "#fef3c7", text: "#92400e" },
    published: { bg: "#dcfce7", text: "#16a34a" },
    scheduled: { bg: "#dbeafe", text: "#1d4ed8" },
    archived: { bg: "#f3f4f6", text: "#6b7280" },
  };

  const badgeStyles: CSSProperties = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500,
    textTransform: "capitalize",
    backgroundColor: colors[status].bg,
    color: colors[status].text,
    ...style,
  };

  return <span className={className} style={badgeStyles}>{status}</span>;
}

/**
 * PublishButton component props
 */
export interface PublishButtonProps {
  status: PublishStatus;
  isLoading?: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onSchedule: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Publish button component
 */
export function PublishButton({ status, isLoading, onPublish, onUnpublish, onSchedule, className = "", style }: PublishButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const buttonStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: isLoading ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: status === "published" ? "#10b981" : "#3b82f6",
    color: "white",
    position: "relative",
    ...style,
  };

  const menuStyles: CSSProperties = {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    minWidth: "150px",
    zIndex: 10,
  };

  const menuItemStyles: CSSProperties = {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div className={className} style={{ position: "relative" }}>
      <button style={buttonStyles} disabled={isLoading} onClick={() => setShowMenu(!showMenu)}>
        <StatusBadge status={status} style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }} />
        <span>&#9660;</span>
      </button>

      {showMenu && (
        <div style={menuStyles}>
          {status !== "published" && (
            <button style={menuItemStyles} onClick={() => { onPublish(); setShowMenu(false); }}>Publish Now</button>
          )}
          {status === "published" && (
            <button style={menuItemStyles} onClick={() => { onUnpublish(); setShowMenu(false); }}>Unpublish</button>
          )}
          <button style={menuItemStyles} onClick={() => { onSchedule(); setShowMenu(false); }}>Schedule...</button>
        </div>
      )}
    </div>
  );
}

/**
 * ScheduleModal component props
 */
export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  currentSchedule?: string | null;
}

/**
 * Schedule modal component
 */
export function ScheduleModal({ isOpen, onClose, onSchedule, currentSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState(currentSchedule ? new Date(currentSchedule).toISOString().slice(0, 16) : "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) onSchedule(new Date(date));
    onClose();
  };

  const modalStyles: CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
  };

  const contentStyles: CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "400px",
    width: "90%",
  };

  return (
    <div style={modalStyles} onClick={onClose}>
      <div style={contentStyles} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 600 }}>Schedule Publication</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", marginBottom: "16px" }}
            required
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", border: "none", borderRadius: "6px", backgroundColor: "#3b82f6", color: "white", cursor: "pointer" }}>Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
}
