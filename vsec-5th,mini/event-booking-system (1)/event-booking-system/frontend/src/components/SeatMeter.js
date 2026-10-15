import React from 'react';

// A thin bar showing how full an event is, with a plain-language label.
function SeatMeter({ available, total }) {
  const sold = total - available;
  const pct = total ? Math.round((sold / total) * 100) : 0;
  let label = `${available} of ${total} seats left`;
  let tone = '';
  if (available === 0) {
    label = 'Sold out';
    tone = 'meter-soldout';
  } else if (available <= Math.max(3, total * 0.15)) {
    label = `Only ${available} left`;
    tone = 'meter-low';
  }
  return (
    <div className={`meter ${tone}`}>
      <div className="meter-track" role="presentation">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="meter-label">{label}</span>
    </div>
  );
}

export default SeatMeter;
