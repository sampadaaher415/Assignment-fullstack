import React from 'react';
import { STATE_LABEL } from '../utils/format';

function StatusPill({ state }) {
  return <span className={`pill pill-${state}`}>{STATE_LABEL[state] || state}</span>;
}

export default StatusPill;
