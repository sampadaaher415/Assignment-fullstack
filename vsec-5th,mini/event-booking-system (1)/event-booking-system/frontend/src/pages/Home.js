import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../api';
import DateBlock from '../components/DateBlock';
import SeatMeter from '../components/SeatMeter';
import { Loading, Message } from '../components/PageState';
import { formatRupees, formatTime } from '../utils/format';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(events.map((e) => e.category || 'Other')))],
    [events]
  );

  const visible = events.filter((e) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || `${e.title} ${e.venue} ${e.description}`.toLowerCase().includes(q);
    const matchesCategory = category === 'All' || (e.category || 'Other') === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Find a seat for what’s on next.</h1>
        <p className="hero-sub">
          Pick an event, choose your seats from the map, and get a QR ticket you can show at the door.
        </p>

        <div className="filters">
          <label className="search">
            <span className="sr-only">Search events</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              type="search"
              placeholder="Search by event or venue"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {categories.length > 2 && (
            <div className="chips" role="group" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {loading && <Loading label="Loading events" />}
      {error && <Message tone="error" title="Events didn’t load" body={error} action={{ onClick: () => window.location.reload(), label: 'Try again' }} />}

      {!loading && !error && events.length === 0 && (
        <Message title="Nothing scheduled yet" body="New events will show up here as soon as they’re announced." />
      )}

      {!loading && !error && events.length > 0 && visible.length === 0 && (
        <Message
          title="No events match"
          body="Try a different search or category."
          action={{ onClick: () => { setQuery(''); setCategory('All'); }, label: 'Clear filters' }}
        />
      )}

      {visible.length > 0 && (
        <ol className="listing" aria-label="Upcoming events">
          {visible.map((e) => (
            <li key={e._id}>
              <Link to={`/events/${e._id}`} className={`listing-row ${e.availableSeats === 0 ? 'is-soldout' : ''}`}>
                <DateBlock date={e.date} />
                <div className="listing-main">
                  <span className="tag">{e.category || 'Other'}</span>
                  <h2>{e.title}</h2>
                  <p className="listing-where">
                    {e.venue}
                    {e.time && <span className="listing-time">{formatTime(e.time)}</span>}
                  </p>
                </div>
                <div className="listing-side">
                  <span className="listing-price">
                    {e.price > 0 ? formatRupees(e.price) : 'Free'}
                    {e.price > 0 && <small> / seat</small>}
                  </span>
                  <SeatMeter available={e.availableSeats} total={e.totalSeats} />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default Home;
