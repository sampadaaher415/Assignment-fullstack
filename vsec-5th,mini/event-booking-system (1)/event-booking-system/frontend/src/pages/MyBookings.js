import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings } from '../api';
import TicketStub from '../components/TicketStub';
import StatusPill from '../components/StatusPill';
import DateBlock from '../components/DateBlock';
import { Loading, Message } from '../components/PageState';
import { bookingState, formatRupees, formatTime } from '../utils/format';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', match: (s) => s === 'confirmed' || s === 'checked-in' },
  { id: 'past', label: 'Past', match: (s) => s === 'past' },
  { id: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
];

function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    getMyBookings().then(setBookings).catch((err) => setError(err.message));
  }, []);

  if (error) return <Message tone="error" title="Your tickets didn’t load" body={error} />;
  if (!bookings) return <Loading label="Loading your tickets" />;

  const withState = bookings
    .map((b) => ({ ...b, state: bookingState(b) }))
    .sort((a, b) => `${a.eventDate}${a.eventTime || ''}`.localeCompare(`${b.eventDate}${b.eventTime || ''}`));
  const active = TABS.find((t) => t.id === tab);
  let list = withState.filter((b) => active.match(b.state));
  if (tab !== 'upcoming') list = [...list].reverse();

  return (
    <div className="my-bookings">
      <h1 className="page-title">My tickets</h1>

      <div className="tabs" role="tablist" aria-label="Ticket groups">
        {TABS.map((t) => {
          const count = withState.filter((b) => t.match(b.state)).length;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              className="tab"
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        tab === 'upcoming' ? (
          <Message title="No upcoming tickets" body="When you book seats, your tickets will appear here." action={{ to: '/', label: 'Find an event' }} />
        ) : (
          <Message title={`No ${active.label.toLowerCase()} tickets`} />
        )
      ) : (
        <ul className="stub-list">
          {list.map((b) => (
            <li key={b.ticketId}>
              <Link to={`/tickets/${b.ticketId}`} className="stub-link" aria-label={`Open ticket for ${b.eventTitle}`}>
                <TicketStub
                  variant="compact"
                  state={b.state}
                  title={b.eventTitle}
                  subtitle={[b.venue, formatTime(b.eventTime)].filter(Boolean).join(', ')}
                  fields={[
                    ['Seats', b.seatNumbers.join(', ')],
                    ['Paid', formatRupees(b.totalAmount)],
                  ]}
                  stub={
                    <>
                      <DateBlock date={b.eventDate} size="sm" />
                      <StatusPill state={b.state} />
                    </>
                  }
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyBookings;
