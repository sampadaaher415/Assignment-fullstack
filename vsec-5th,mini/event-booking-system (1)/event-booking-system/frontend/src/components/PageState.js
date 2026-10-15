import React from 'react';
import { Link } from 'react-router-dom';

export function Loading({ label = 'Loading' }) {
  return (
    <div className="page-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}…</p>
    </div>
  );
}

export function Message({ title, body, action, tone = 'neutral' }) {
  return (
    <div className={`page-state page-state-${tone}`}>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn btn-primary">{action.label}</Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={action.onClick}>{action.label}</button>
        ))}
    </div>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return <p className="inline-error" role="alert">{children}</p>;
}
