import React from 'react';
import { dateParts } from '../utils/format';

function DateBlock({ date, size = 'md' }) {
  const { day, month, weekday } = dateParts(date);
  return (
    <div className={`date-block date-block-${size}`} aria-hidden="true">
      <span className="date-month">{month}</span>
      <span className="date-day">{day}</span>
      <span className="date-weekday">{weekday}</span>
    </div>
  );
}

export default DateBlock;
