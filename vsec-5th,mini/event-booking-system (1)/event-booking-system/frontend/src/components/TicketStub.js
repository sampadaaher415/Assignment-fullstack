import React from 'react';

// The perforated ticket used for the live booking preview, the ticket page
// and the My tickets list. `stub` is the tear-off part on the right.
function TicketStub({ title, subtitle, fields = [], stub, state, variant = 'full', className = '', children }) {
  return (
    <div className={`ticket-wrap ${className}`}>
    <article className={`ticket ticket-${variant} ${state ? `ticket-is-${state}` : ''}`}>
      <div className="ticket-body">
        <h3 className="ticket-title">{title}</h3>
        {subtitle && <p className="ticket-subtitle">{subtitle}</p>}
        {fields.length > 0 && (
          <dl className="ticket-fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
      </div>
      {stub && <div className="ticket-stub">{stub}</div>}
    </article>
    </div>
  );
}

export default TicketStub;
