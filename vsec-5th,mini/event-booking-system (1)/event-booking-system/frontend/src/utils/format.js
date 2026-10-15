// Event dates are stored as YYYY-MM-DD; parse them as local dates.
export function parseDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function dateParts(iso) {
  const d = parseDate(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' }),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
  };
}

export function formatDate(iso) {
  return parseDate(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(iso) {
  return parseDate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatWhen(date, time) {
  return [formatDate(date), formatTime(time)].filter(Boolean).join(', ');
}

const rupee = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export function formatRupees(n) {
  return rupee.format(Number(n) || 0);
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function bookingState(b) {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.checkedInAt) return 'checked-in';
  if (b.eventDate < todayISO()) return 'past';
  return 'confirmed';
}

export const STATE_LABEL = {
  confirmed: 'Confirmed',
  'checked-in': 'Checked in',
  cancelled: 'Cancelled',
  past: 'Event over',
};
