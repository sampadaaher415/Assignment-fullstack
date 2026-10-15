import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createEvent, getCategories, getEvent, updateEvent } from '../../api';
import { InlineError, Loading, Message } from '../../components/PageState';

const EMPTY = { title: '', category: 'Other', description: '', date: '', time: '', venue: '', price: '', totalSeats: '' };

function EventForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState(['Other']);
  const [minSeats, setMinSeats] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    if (!isEdit) return;
    getEvent(id)
      .then((e) => {
        setForm({
          title: e.title,
          category: e.category || 'Other',
          description: e.description || '',
          date: e.date,
          time: e.time || '',
          venue: e.venue,
          price: String(e.price),
          totalSeats: String(e.totalSeats),
        });
        setMinSeats(e.totalSeats);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { ...form, price: Number(form.price || 0), totalSeats: Number(form.totalSeats) };
    try {
      if (isEdit) await updateEvent(id, payload);
      else await createEvent(payload);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loadError) return <Message tone="error" title="Event not found" body={loadError} action={{ to: '/admin', label: 'Back to dashboard' }} />;
  if (loading) return <Loading label="Loading event" />;

  return (
    <div className="admin admin-form">
      <Link to="/admin" className="back-link">Dashboard</Link>
      <h1 className="page-title">{isEdit ? 'Edit event' : 'New event'}</h1>

      <form className="form form-wide" onSubmit={handleSubmit}>
        <label className="field field-span">
          <span>Title</span>
          <input value={form.title} onChange={update('title')} required maxLength={120} />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={update('category')}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Venue</span>
          <input value={form.venue} onChange={update('venue')} required maxLength={120} />
        </label>
        <label className="field field-span">
          <span>Description</span>
          <textarea rows={4} value={form.description} onChange={update('description')} maxLength={1000} />
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" value={form.date} onChange={update('date')} required />
        </label>
        <label className="field">
          <span>Start time</span>
          <input type="time" value={form.time} onChange={update('time')} />
        </label>
        <label className="field">
          <span>Price per seat (₹)</span>
          <input type="number" min="0" step="1" inputMode="numeric" value={form.price} onChange={update('price')} placeholder="0 for free" />
        </label>
        <label className="field">
          <span>Total seats</span>
          <input type="number" min={minSeats} max="500" step="1" inputMode="numeric" value={form.totalSeats} onChange={update('totalSeats')} required />
          {isEdit && <small>You can add seats, but not remove them. Currently {minSeats}.</small>}
        </label>

        <div className="field-span">
          <InlineError>{error}</InlineError>
          <div className="actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
            </button>
            <Link to="/admin" className="btn btn-quiet">Discard</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EventForm;
