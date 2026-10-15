import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createBooking, getEvent } from '../api';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import TicketStub from '../components/TicketStub';
import DateBlock from '../components/DateBlock';
import { InlineError, Loading, Message } from '../components/PageState';
import { formatRupees, formatWhen, todayISO } from '../utils/format';

const MAX_SEATS = 10;
const draftKey = (id) => `seatwise.draft.${id}`;

function EventDetail({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(() => {
    // Restore seats picked before being sent to log in.
    try {
      return JSON.parse(sessionStorage.getItem(draftKey(id))) || [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => getEvent(id).then(setEvent), [id]);

  useEffect(() => {
    load().catch((err) => setLoadError(err.message));
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey(id), JSON.stringify(selected));
    } catch {
      /* ignore */
    }
  }, [id, selected]);

  // Drop restored picks that have since been taken.
  useEffect(() => {
    if (!event) return;
    const taken = new Set(event.seats.filter((s) => s.isBooked).map((s) => s.seatNumber));
    setSelected((prev) => (prev.some((s) => taken.has(s)) ? prev.filter((s) => !taken.has(s)) : prev));
  }, [event]);

  const toggleSeat = (seat) => {
    setError('');
    if (selected.includes(seat.seatNumber)) {
      setSelected(selected.filter((s) => s !== seat.seatNumber));
    } else if (selected.length >= MAX_SEATS) {
      setError(`You can book up to ${MAX_SEATS} seats at a time.`);
    } else {
      setSelected([...selected, seat.seatNumber]);
    }
  };

  const handleBook = async () => {
    if (!user) {
      navigate('/login', { state: { from: location, reason: 'Log in to book your seats. We’ll keep your picks.' } });
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const ticket = await createBooking({ eventId: id, seatNumbers: selected });
      sessionStorage.removeItem(draftKey(id));
      navigate(`/tickets/${ticket.ticketId}`, { state: { justBooked: true } });
    } catch (err) {
      if (err.status === 409) {
        const lost = err.data?.seats || [];
        setSelected((prev) => prev.filter((s) => !lost.includes(s)));
        setError(`${lost.length ? `Seat${lost.length > 1 ? 's' : ''} ${lost.join(', ')} just went.` : err.message} Pick another and try again.`);
        load().catch(() => {});
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return <Message tone="error" title="Event not found" body={loadError} action={{ to: '/', label: 'Browse events' }} />;
  }
  if (!event) return <Loading label="Loading seats" />;

  const isPast = event.date < todayISO();
  const soldOut = event.availableSeats === 0;
  const sorted = [...selected].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const total = selected.length * event.price;

  return (
    <div className="event-page">
      <Link to="/" className="back-link">All events</Link>

      <header className="event-head">
        <DateBlock date={event.date} size="lg" />
        <div>
          <span className="tag">{event.category || 'Other'}</span>
          <h1 className="page-title">{event.title}</h1>
          <p className="event-when">{formatWhen(event.date, event.time)}</p>
          <p className="event-venue">{event.venue}</p>
        </div>
      </header>

      {event.description && <p className="event-about">{event.description}</p>}

      <div className="booking-layout">
        <section aria-labelledby="pick-seats">
          <div className="section-head">
            <h2 id="pick-seats">Pick your seats</h2>
            <span className="muted">{event.availableSeats} of {event.totalSeats} available</span>
          </div>
          <SeatMap seats={event.seats} selected={selected} onToggle={toggleSeat} disabled={isPast} />
        </section>

        <aside className="booking-aside" aria-label="Your booking">
          <TicketStub
            variant="draft"
            title={event.title}
            subtitle={formatWhen(event.date, event.time)}
            fields={[
              ['Seats', sorted.length ? sorted.join(', ') : 'Tap seats on the map'],
              ['Price', `${formatRupees(event.price)} × ${selected.length}`],
            ]}
            stub={
              <div className="stub-total">
                <span>Total</span>
                <strong>{formatRupees(total)}</strong>
              </div>
            }
          />
          <InlineError>{error}</InlineError>
          {isPast ? (
            <p className="muted">This event has already happened.</p>
          ) : soldOut ? (
            <p className="muted">This event is sold out.</p>
          ) : (
            <button
              type="button"
              className="btn btn-accent btn-block btn-lg"
              disabled={selected.length === 0 || submitting}
              onClick={handleBook}
            >
              {submitting
                ? 'Booking your seats…'
                : selected.length === 0
                  ? 'Select seats to continue'
                  : user
                    ? `Book ${selected.length} seat${selected.length > 1 ? 's' : ''} for ${formatRupees(total)}`
                    : 'Log in to book'}
            </button>
          )}
          {user && selected.length > 0 && (
            <p className="fine-print">Your ticket will be issued to {user.name} ({user.email}).</p>
          )}
        </aside>
      </div>
    </div>
  );
}

// Remount when the id changes so per-event state (like picked seats) resets.
function EventDetailRoute() {
  const { id } = useParams();
  return <EventDetail key={id} id={id} />;
}

export default EventDetailRoute;
