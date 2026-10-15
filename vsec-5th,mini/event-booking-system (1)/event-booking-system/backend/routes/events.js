const express = require('express');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { toObjectId, todayISO } = require('../utils/helpers');

const router = express.Router();

const CATEGORIES = ['Conference', 'Music', 'Workshop', 'Comedy', 'Sports', 'Theatre', 'Other'];
const MAX_SEATS = 500;

const makeSeats = (from, to) =>
  Array.from({ length: to - from }, (_, i) => ({ seatNumber: `S${from + i + 1}`, isBooked: false }));

// List views don't need the full seat array, just the counts.
function summarize(event) {
  const { seats = [], ...rest } = event;
  return {
    ...rest,
    totalSeats: seats.length,
    availableSeats: seats.filter((s) => !s.isBooked).length,
  };
}

// Validates create/update input. With partial=true, missing fields are allowed.
function parseEventInput(body = {}, { partial = false } = {}) {
  const data = {};
  const has = (k) => body[k] !== undefined;

  if (has('title') || !partial) {
    const title = String(body.title || '').trim();
    if (!title) return { error: 'Title is required.' };
    data.title = title;
  }
  if (has('description')) data.description = String(body.description || '').trim();
  if (has('venue') || !partial) {
    const venue = String(body.venue || '').trim();
    if (!venue) return { error: 'Venue is required.' };
    data.venue = venue;
  }
  if (has('date') || !partial) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ''))) {
      return { error: 'Date must be in YYYY-MM-DD format.' };
    }
    data.date = body.date;
  }
  if (has('time')) {
    const time = String(body.time || '');
    if (time && !/^\d{2}:\d{2}$/.test(time)) return { error: 'Time must be in HH:MM format.' };
    data.time = time;
  }
  if (has('price') || !partial) {
    const price = Number(body.price ?? 0);
    if (!Number.isFinite(price) || price < 0) return { error: 'Price must be 0 or more.' };
    data.price = Math.round(price);
  }
  if (has('category')) {
    data.category = CATEGORIES.includes(body.category) ? body.category : 'Other';
  }
  if (has('totalSeats') || !partial) {
    const n = Number(body.totalSeats);
    if (!Number.isInteger(n) || n < 1 || n > MAX_SEATS) {
      return { error: `Total seats must be a whole number between 1 and ${MAX_SEATS}.` };
    }
    data.totalSeats = n;
  }
  return { data };
}

// GET /api/events            upcoming events (summaries)
// GET /api/events?when=all   every event, including past ones
router.get('/', async (req, res) => {
  const filter = req.query.when === 'all' ? {} : { date: { $gte: todayISO() } };
  const events = await getDB().collection('events').find(filter).sort({ date: 1, time: 1 }).toArray();
  res.json(events.map(summarize));
});

// GET /api/events/categories
router.get('/categories', (req, res) => res.json(CATEGORIES));

// GET /api/events/:id   full event with seat map
router.get('/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid event id.' });
  const event = await getDB().collection('events').findOne({ _id: id });
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  res.json({ ...event, ...summarize(event), seats: event.seats });
});

// POST /api/events   (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { data, error } = parseEventInput(req.body);
  if (error) return res.status(400).json({ error });

  const { totalSeats, ...fields } = data;
  const event = {
    description: '',
    time: '',
    category: 'Other',
    ...fields,
    seats: makeSeats(0, totalSeats),
    createdAt: new Date(),
  };
  const result = await getDB().collection('events').insertOne(event);
  res.status(201).json(summarize({ _id: result.insertedId, ...event }));
});

// PUT /api/events/:id   (admin) — seats can be added, never removed
router.put('/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid event id.' });

  const { data, error } = parseEventInput(req.body, { partial: true });
  if (error) return res.status(400).json({ error });

  const events = getDB().collection('events');
  const event = await events.findOne({ _id: id });
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const { totalSeats, ...fields } = data;
  const update = { $set: { ...fields, updatedAt: new Date() } };

  if (totalSeats !== undefined) {
    const current = event.seats.length;
    if (totalSeats < current) {
      return res.status(400).json({ error: `Seats can only be added. This event already has ${current}.` });
    }
    if (totalSeats > current) {
      update.$push = { seats: { $each: makeSeats(current, totalSeats) } };
    }
  }

  await events.updateOne({ _id: id }, update);
  res.json(summarize(await events.findOne({ _id: id })));
});

// DELETE /api/events/:id   (admin) — only when nobody holds a ticket
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid event id.' });

  const db = getDB();
  const active = await db.collection('bookings').countDocuments({ eventId: id, status: 'confirmed' });
  if (active > 0) {
    return res.status(409).json({
      error: `This event has ${active} active booking${active === 1 ? '' : 's'}. Cancel them before deleting the event.`,
    });
  }

  const result = await db.collection('events').deleteOne({ _id: id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Event not found.' });
  await db.collection('bookings').deleteMany({ eventId: id });
  res.json({ deleted: true });
});

module.exports = router;
module.exports.CATEGORIES = CATEGORIES;
