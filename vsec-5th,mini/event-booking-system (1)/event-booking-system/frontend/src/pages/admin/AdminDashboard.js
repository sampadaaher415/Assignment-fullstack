import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteEvent, getAdminStats, getEvents } from '../../api';
import ConfirmButton from '../../components/ConfirmButton';
import { InlineError, Loading, Message } from '../../components/PageState';
import { formatRupees, formatShortDate, formatTime, todayISO } from '../../utils/format';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([getAdminStats(), getEvents({ all: true })])
        .then(([s, e]) => {
          setStats(s);
          setEvents(e);
        })
        .catch((err) => setError(err.message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    setActionError('');
    setDeleting(id);
    try {
      await deleteEvent(id);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (error) return <Message tone="error" title="Dashboard didn’t load" body={error} />;
  if (!stats || !events) return <Loading label="Loading dashboard" />;

  const today = todayISO();
  const shown = showPast ? events : events.filter((e) => e.date >= today);
  const attendance = stats.bookings ? Math.round((stats.checkedIn / stats.bookings) * 100) : 0;

  return (
    <div className="admin">
      <div className="admin-head">
        <h1 className="page-title">Dashboard</h1>
        <div className="actions">
          <Link to="/admin/check-in" className="btn btn-quiet">Open check-in</Link>
          <Link to="/admin/events/new" className="btn btn-accent">New event</Link>
        </div>
      </div>

      <dl className="stats">
        <div><dt>Revenue</dt><dd>{formatRupees(stats.revenue)}</dd></div>
        <div><dt>Seats sold</dt><dd>{stats.seatsSold}</dd><small>{stats.bookings} bookings</small></div>
        <div><dt>Checked in</dt><dd>{stats.checkedIn}</dd><small>{attendance}% of bookings</small></div>
        <div><dt>Upcoming events</dt><dd>{stats.upcoming}</dd><small>{stats.events} in total</small></div>
      </dl>

      <div className="section-head">
        <h2>Events</h2>
        <label className="toggle">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          <span>Show past events</span>
        </label>
      </div>
      <InlineError>{actionError}</InlineError>

      {shown.length === 0 ? (
        <Message title="No events yet" body="Create your first event to start selling seats." action={{ to: '/admin/events/new', label: 'New event' }} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Date</th>
                <th scope="col">Sold</th>
                <th scope="col">Price</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => {
                const sold = e.totalSeats - e.availableSeats;
                return (
                  <tr key={e._id} className={e.date < today ? 'is-past' : ''}>
                    <td>
                      <strong>{e.title}</strong>
                      <span className="cell-sub">{e.venue}</span>
                    </td>
                    <td>
                      {formatShortDate(e.date)}
                      {e.time && <span className="cell-sub">{formatTime(e.time)}</span>}
                    </td>
                    <td>
                      <span className="mini-meter" style={{ '--pct': `${(sold / e.totalSeats) * 100}%` }} />
                      {sold}/{e.totalSeats}
                    </td>
                    <td>{formatRupees(e.price)}</td>
                    <td className="row-actions">
                      <Link to={`/admin/events/${e._id}/bookings`} className="btn btn-quiet btn-sm">Bookings</Link>
                      <Link to={`/admin/events/${e._id}/edit`} className="btn btn-quiet btn-sm">Edit</Link>
                      {sold === 0 && (
                        <ConfirmButton
                          className="btn-sm"
                          label="Delete"
                          question="Delete this event?"
                          confirmLabel="Delete"
                          onConfirm={() => handleDelete(e._id)}
                          busy={deleting === e._id}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
