import React from 'react';

const PER_ROW = 8;

function SeatMap({ seats, selected, onToggle, disabled }) {
  const rows = [];
  for (let i = 0; i < seats.length; i += PER_ROW) rows.push(seats.slice(i, i + PER_ROW));

  return (
    <div className="seatmap">
      <div className="stage" aria-hidden="true"><span>Stage</span></div>
      <div className="seat-rows" role="group" aria-label="Seat map">
        {rows.map((row, r) => (
          <div className="seat-row" key={r}>
            {row.map((seat) => {
              const isSelected = selected.includes(seat.seatNumber);
              const state = seat.isBooked ? 'booked' : isSelected ? 'selected' : 'open';
              return (
                <button
                  key={seat.seatNumber}
                  type="button"
                  className={`seat seat-${state}`}
                  disabled={seat.isBooked || disabled}
                  aria-pressed={isSelected}
                  aria-label={`Seat ${seat.seatNumber}, ${seat.isBooked ? 'taken' : isSelected ? 'selected' : 'available'}`}
                  onClick={() => onToggle(seat)}
                >
                  {seat.seatNumber.replace(/^S/, '')}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="seat-legend">
        <li><i className="swatch swatch-open" /> Available</li>
        <li><i className="swatch swatch-selected" /> Your pick</li>
        <li><i className="swatch swatch-booked" /> Taken</li>
      </ul>
    </div>
  );
}

export default SeatMap;
