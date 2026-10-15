import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cancelBooking, getEvent, getEventBookings } from '../../api';
import StatusPill from '../../components/StatusPill';
import ConfirmButton from '../../components/ConfirmButton';
import { InlineError, Loading, Message } from '../../components/PageState';
import { bookingState, formatDateTime, formatRupees, formatWhen } from '../../utils/format';

function EventBookings() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () =>
      Promise.all([getEvent(id), getEventBookings(id)])
        .then(([e, b]) => {
          setEvent(e);
          setBookings(b);
        })
        .catch((err) => setError(err.message)),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (ticketId) => {
    setActionError('');
    setBusy(ticketId);
    try {
      await cancelBooking(ticketId);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Message tone="error" title="Bookings didn’t load" body={error} action={{ to: '/admin', label: 'Back to dashboard' }} />;
  if (!event || !bookings) return <Loading label="Loading bookings" />;

  const q = query.trim().toLowerCase();
  const rows = bookings
    .map((b) => ({ ...b, state: bookingState(b) }))
    .filter((b) => !q || `${b.customerName} ${b.customerEmail} ${b.ticketId} ${b.seatNumbers.join(' ')}`.toLowerCase().includes(q));
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const revenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const checkedIn = confirmed.filter((b) => b.checkedInAt).length;

  return (
    <div className="admin">
      <Link to="/admin" className="back-link">Dashboard</Link>
      <div className="admin-head">
        <div>
          <h1 className="page-title">{event.title}</h1>
          <p className="muted">{formatWhen(event.date, event.time)}, {event.venue}</p>
        </div>
        <Link to={`/admin/check-in?event=${id}`} className="btn btn-accent">Check in guests</Link>
      </div>

      <dl className="stats stats-3">
        <div><dt>Seats sold</dt><dd>{event.totalSeats - event.availableSeats}<span className="stat-of">/{event.totalSeats}</span></dd></div>
        <div><dt>Revenue</dt><dd>{formatRupees(revenue)}</dd></div>
        <div><dt>Checked in</dt><dd>{checkedIn}<span className="stat-of">/{confirmed.length}</span></dd></div>
      </dl>

      <div className="section-head">
        <h2>Bookings</h2>
        <label className="search search-sm">
          <span className="sr-only">Search bookings</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" placeholder="Name, email, seat or ticket" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <InlineError>{actionError}</InlineError>

      {rows.length === 0 ? (
        <Message title={bookings.length ? 'No bookings match' : 'No bookings yet'} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Seats</th>
                <th scope="col">Paid</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.ticketId}>
                  <td>
                    <strong>{b.customerName}</strong>
                    <span className="cell-sub">{b.customerEmail}</span>
                  </td>
                  <td>{b.seatNumbers.join(', ')}</td>
                  <td>{formatRupees(b.totalAmount)}</td>
                  <td>
                    <StatusPill state={b.state} />
                    {b.checkedInAt && <span className="cell-sub">{formatDateTime(b.checkedInAt)}</span>}
                  </td>
                  <td className="row-actions">
                    <Link to={`/tickets/${b.ticketId}`} className="btn btn-quiet btn-sm">Ticket</Link>
                    {b.status === 'confirmed' && !b.checkedInAt && (
                      <ConfirmButton
                        className="btn-sm"
                        label="Cancel"
                        question="Cancel and release seats?"
                        confirmLabel="Cancel booking"
                        onConfirm={() => handleCancel(b.ticketId)}
                        busy={busy === b.ticketId}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventBookings;
