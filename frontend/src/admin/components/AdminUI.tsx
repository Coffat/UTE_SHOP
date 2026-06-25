import { useState, useCallback, type ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

function DangerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const VARIANT_CONFIG = {
  danger:  { icon: DangerIcon, color: "#f43f5e", bg: "rgba(244,63,94,0.12)", btnClass: "admin-modal-btn-danger" },
  warning: { icon: DangerIcon, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", btnClass: "admin-modal-btn-warning" },
  info:    { icon: InfoIcon,   color: "#6366f1", bg: "rgba(99,102,241,0.12)", btnClass: "admin-modal-btn-primary" },
};

export function ConfirmModal({
  isOpen, title, message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  onConfirm, onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const cfg = VARIANT_CONFIG[variant];
  const IconComp = cfg.icon;

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-icon-wrap" style={{ background: cfg.bg }}>
          <span style={{ color: cfg.color }}><IconComp /></span>
        </div>
        <h3 className="admin-modal-title">{title}</h3>
        <p className="admin-modal-message">{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-modal-btn admin-modal-btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`admin-modal-btn ${cfg.btnClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generic Slide-over Panel ──────────────────────────────────────────────────
interface SlideoverProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Slideover({ isOpen, title, onClose, children, width = "480px" }: SlideoverProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`admin-slideover-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`admin-slideover ${isOpen ? "open" : ""}`}
        style={{ width }}
      >
        <div className="admin-slideover-header">
          <h2 className="admin-slideover-title">{title}</h2>
          <button className="admin-slideover-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="admin-slideover-body">{children}</div>
      </div>
    </>
  );
}

// ── CRUD Modal (center form dialog) ───────────────────────────────────────────
interface CrudModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  title?: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "xxl";
}

export function CrudModal({
  isOpen,
  mode,
  title,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  cancelLabel = "Hủy",
  children,
  size = "md",
}: CrudModalProps) {
  if (!isOpen) return null;

  const resolvedTitle = title ?? (mode === "create" ? "Thêm mới" : "Chỉnh sửa");
  const resolvedSubmitLabel =
    submitLabel ?? (mode === "create" ? "Tạo mới" : "Lưu thay đổi");

  const sizeClass = size === "xxl" ? "admin-crud-modal--xxl" : size === "xl" ? "admin-crud-modal--xl" : size === "lg" ? "admin-crud-modal--lg" : "";

  return (
    <div
      className={`admin-crud-modal-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`admin-crud-modal ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-crud-modal-title"
      >
        <div className="admin-crud-modal-header">
          <h2 id="admin-crud-modal-title" className="admin-crud-modal-title">
            {resolvedTitle}
          </h2>
          <button type="button" className="admin-crud-modal-close" onClick={onClose} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form className="admin-crud-modal-form admin-form" onSubmit={onSubmit}>
          <div className="admin-crud-modal-body">{children}</div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose} disabled={submitting}>
              {cancelLabel}
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
              {submitting ? "Đang lưu..." : resolvedSubmitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function useCrudModal<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setMode("create");
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setMode("edit");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
  }, []);

  return { isOpen, mode, editingItem, openCreate, openEdit, close };
}

// ── Form Field ────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="admin-form-field">
      <label className="admin-form-label">
        {label}
        {required && <span className="admin-form-required">*</span>}
      </label>
      {children}
      {error && <p className="admin-form-error">{error}</p>}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="admin-form-input" {...props} />;
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="admin-form-select" {...props} />
  );
}

export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="admin-form-textarea" rows={4} {...props} />;
}

// ── useConfirm hook ───────────────────────────────────────────────────────────
interface ConfirmOptions {
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  confirmLabel?: string;
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    resolve?: (v: boolean) => void;
    opts?: ConfirmOptions;
  }>({ open: false });

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, opts });
    });
  }, []);

  const ModalEl = (
    <ConfirmModal
      isOpen={state.open}
      title={state.opts?.title ?? ""}
      message={state.opts?.message ?? ""}
      variant={state.opts?.variant}
      confirmLabel={state.opts?.confirmLabel}
      onConfirm={() => {
        state.resolve?.(true);
        setState({ open: false });
      }}
      onCancel={() => {
        state.resolve?.(false);
        setState({ open: false });
      }}
    />
  );

  return { confirm, ModalEl };
}
