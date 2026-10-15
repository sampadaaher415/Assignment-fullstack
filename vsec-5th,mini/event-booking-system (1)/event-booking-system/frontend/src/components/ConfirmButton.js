import React, { useState } from 'react';

// A destructive action that asks for confirmation inline instead of a browser dialog.
function ConfirmButton({ label, question, confirmLabel, keepLabel = 'Keep it', onConfirm, busy, className = '' }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" className={`btn btn-danger-quiet ${className}`} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="confirm" role="group" aria-label={question}>
      <span>{question}</span>
      <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
        {busy ? 'Working…' : confirmLabel}
      </button>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAsking(false)} disabled={busy}>
        {keepLabel}
      </button>
    </div>
  );
}

export default ConfirmButton;
