/**
 * @fileoverview Create content modal component
 *
 * Modal dialog for creating new content with title input and slug preview.
 * Replaces the native window.prompt for a better user experience.
 *
 * @module @writenex/astro/client/components/CreateContentModal
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { X, FileText } from "lucide-react";
import "./CreateContentModal.css";

/**
 * Props for CreateContentModal component
 */
interface CreateContentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when content is created */
  onCreate: (title: string) => void;
  /** Collection name for display */
  collectionName: string;
  /** Whether creation is in progress */
  isCreating?: boolean;
}

/**
 * Generate a URL-safe slug from a title
 *
 * @param title - The title to slugify
 * @returns URL-safe slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Modal dialog for creating new content
 *
 * Features:
 * - Title input with auto-focus
 * - Real-time slug preview
 * - Keyboard navigation (Enter to create, Escape to close)
 * - Loading state during creation
 *
 * @component
 * @example
 * ```tsx
 * <CreateContentModal
 *   isOpen={showCreateModal}
 *   onClose={() => setShowCreateModal(false)}
 *   onCreate={handleCreate}
 *   collectionName="blog"
 * />
 * ```
 */
export function CreateContentModal({
  isOpen,
  onClose,
  onCreate,
  collectionName,
  isCreating = false,
}: CreateContentModalProps): React.ReactElement | null {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (trimmedTitle && !isCreating) {
        onCreate(trimmedTitle);
      }
    },
    [title, isCreating, onCreate]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isCreating) {
        onClose();
      }
    },
    [onClose, isCreating]
  );

  const slug = generateSlug(title);
  const isValid = title.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="wn-create-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="wn-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
      >
        {/* Header */}
        <div className="wn-create-modal-header">
          <div className="wn-create-modal-header-content">
            <FileText size={18} className="wn-create-modal-icon" />
            <h2 id="create-modal-title" className="wn-create-modal-title">
              Create New Content
            </h2>
          </div>
          <button
            className="wn-create-modal-close"
            onClick={onClose}
            disabled={isCreating}
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="wn-create-modal-body">
          <div className="wn-create-modal-collection">
            Creating in{" "}
            <span className="wn-create-modal-collection-name">
              {collectionName}
            </span>
          </div>

          <div className="wn-create-modal-field">
            <label htmlFor="content-title" className="wn-create-modal-label">
              Title
            </label>
            <input
              ref={inputRef}
              id="content-title"
              type="text"
              className="wn-create-modal-input"
              placeholder="Enter content title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {slug && (
            <div className="wn-create-modal-slug">
              <span className="wn-create-modal-slug-label">Slug:</span>
              <code className="wn-create-modal-slug-value">{slug}</code>
            </div>
          )}

          {/* Footer */}
          <div className="wn-create-modal-footer">
            <button
              type="button"
              className="wn-create-modal-btn wn-create-modal-btn--secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wn-create-modal-btn wn-create-modal-btn--primary"
              disabled={!isValid || isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
