import React, { useEffect } from "react";
import { Icon } from "./Icon";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className = "",
  ...props
}) {
  return (
    <button className={`button button--${variant} button--${size} ${className}`} {...props}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

export function IconButton({ label, icon, className = "", ...props }) {
  return (
    <button aria-label={label} className={`icon-button ${className}`} title={label} {...props}>
      <Icon name={icon} size={19} />
    </button>
  );
}

export function Avatar({ employee, size = "md" }) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ "--avatar-bg": employee?.color || "#e7e3d7" }}
      title={employee?.name}
    >
      {employee?.initials || "—"}
    </span>
  );
}

export function StatusPill({ children, tone = "neutral", dot = false }) {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      {dot && <span className="status-pill__dot" />}
      {children}
    </span>
  );
}

export function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, meta }) {
  return (
    <header className="page-header">
      <div>
        {meta && <span className="page-header__meta">{meta}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Modal({ open, onClose, title, subtitle, children, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div aria-modal="true" className={`modal modal--${size}`} role="dialog">
        <div className="modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton icon="x" label="Cerrar" onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(onClose, 3600);
    return () => clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="toast" role="status">
      <span className="toast__icon">
        <Icon name={toast.type === "error" ? "alert" : "check"} size={17} />
      </span>
      <div>
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button aria-label="Cerrar notificación" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function Metric({ label, value, detail, tone = "default" }) {
  return (
    <div className={`metric metric--${tone}`}>
      <span className="metric__label">{label}</span>
      <strong>{value}</strong>
      {detail && <span className="metric__detail">{detail}</span>}
    </div>
  );
}

export function EmptyState({ icon = "alert", title, children }) {
  return (
    <div className="empty-state">
      <span>
        <Icon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = "green" }) {
  const width = `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
  return (
    <div
      aria-label={`${value} de ${max}`}
      aria-valuemax={max}
      aria-valuemin="0"
      aria-valuenow={value}
      className={`progress progress--${tone}`}
      role="progressbar"
    >
      <span style={{ width }} />
    </div>
  );
}
