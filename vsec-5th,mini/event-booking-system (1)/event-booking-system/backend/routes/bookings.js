const express = require('express');
const QRCode = require('qrcode');
const { randomUUID } = require('crypto');
const { getDB } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { toObjectId, todayISO } = require('../utils/helpers');
const { writeTicketPdf } = require('../utils/ticketPdf');

const router = express.Router();
const MAX_SEATS_PER_BOOKING = 10;

const canAccess = (user, booking) => user.role === 'admin' || String(booking.userId) === user.id;

async function findBooking(ticketId) {
  return getDB().collection('bookings').findOne({ ticketId: String(ticketId) });
}

function setSeats(eventId, seatNumbers, isBooked) {
  return getDB().collection('events').updateOne(
    { _id: eventId },
    { $set: { 'seats.$[s].isBooked': isBooked } },
    { arrayFilters: [{ 's.seatNumber': { $in: seatNumbers } }] }
  );
}

// POST /api/bookings — book seats for the logged-in user
router.post('/', requireAuth, async (req, res) => {
  const db = getDB();
  const eventId = toObjectId(req.body?.eventId);
  const requested = req.body?.seatNumbers;

  if (!eventId) return res.status(400).json({ error: 'Invalid event id.' });
  if (!Array.isArray(requested) || requested.length === 0) {
    return res.status(400).json({ error: 'Select at least one seat.' });
  }
  const seatNumbers = [...new Set(requested.map(String))];
  if (seatNumbers.length > MAX_SEATS_PER_BOOKING) {
    return res.status(400).json({ error: `You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.` });
  }

  const event = await db.collection('events').findOne({ _id: eventId });
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.date < todayISO()) return res.status(400).json({ error: 'This event has already happened.' });

  const valid = new Set(event.seats.map((s) => s.seatNumber));
  const unknown = seatNumbers.filter((s) => !valid.has(s));
  if (unknown.length) return res.status(400).json({ error: `These seats don't exist: ${unknown.join(', ')}.` });

  // Check and claim the seats in a single atomic update. If any seat was
  // already booked (even by a request that landed a millisecond earlier),
  // nothing is modified and we report a conflict.
  const claim = await db.collection('events').updateOne(
    {
      _id: eventId,
      seats: { $not: { $elemMatch: { seatNumber: { $in: seatNumbers }, isBooked: true } } },
    },
    { $set: { 'seats.$[s].isBooked': true } },
    { arrayFilters: [{ 's.seatNumber': { $in: seatNumbers } }] }
  );

  if (claim.modifiedCount === 0) {
    const fresh = await db.collection('events').findOne({ _id: eventId });
    const taken = fresh.seats.filter((s) => seatNumbers.includes(s.seatNumber) && s.isBooked).map((s) => s.seatNumber);
    return res.status(409).json({ error: 'Some of these seats were just booked by someone else.', seats: taken });
  }

  try {
    const ticketId = randomUUID();
    const qrCode = await QRCode.toDataURL(JSON.stringify({ ticketId, eventId: String(eventId), seatNumbers }), {
      margin: 1,
      width: 360,
      color: { dark: '#221C48', light: '#FFFFFF' },
    });

    const booking = {
      ticketId,
      eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time || '',
      venue: event.venue,
      seatNumbers,
      pricePerSeat: event.price,
      totalAmount: event.price * seatNumbers.length,
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      status: 'confirmed',
      checkedInAt: null,
      qrCode,
      createdAt: new Date(),
    };
    await db.collection('bookings').insertOne(booking);
    res.status(201).json(booking);
  } catch (err) {
    // Release the seats so they don't stay booked without a ticket.
    await setSeats(eventId, seatNumbers, false).catch(() => {});
    throw err;
  }
});

// GET /api/bookings/mine — logged-in user's bookings (without QR images)
router.get('/mine', requireAuth, async (req, res) => {
  const bookings = await getDB()
    .collection('bookings')
    .find({ userId: req.user._id }, { projection: { qrCode: 0 } })
    .sort({ eventDate: 1 })
    .toArray();
  res.json(bookings);
});

// GET /api/bookings/:ticketId
router.get('/:ticketId', requireAuth, async (req, res) => {
  const booking = await findBooking(req.params.ticketId);
  if (!booking || !canAccess(req.user, booking)) return res.status(404).json({ error: 'Ticket not found.' });
  res.json(booking);
});

// GET /api/bookings/:ticketId/pdf
router.get('/:ticketId/pdf', requireAuth, async (req, res) => {
  const booking = await findBooking(req.params.ticketId);
  if (!booking || !canAccess(req.user, booking)) return res.status(404).json({ error: 'Ticket not found.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${booking.ticketId.slice(0, 8)}.pdf"`);
  writeTicketPdf(booking, res);
});

// POST /api/bookings/:ticketId/cancel — owner (before the event) or admin
router.post('/:ticketId/cancel', requireAuth, async (req, res) => {
  const booking = await findBooking(req.params.ticketId);
  if (!booking || !canAccess(req.user, booking)) return res.status(404).json({ error: 'Ticket not found.' });

  if (booking.status === 'cancelled') return res.status(409).json({ error: 'This booking is already cancelled.' });
  if (booking.checkedInAt) return res.status(409).json({ error: 'This ticket has been used for entry and can’t be cancelled.' });
  if (req.user.role !== 'admin' && booking.eventDate < todayISO()) {
    return res.status(409).json({ error: 'Past events can’t be cancelled.' });
  }

  const updated = await getDB().collection('bookings').findOneAndUpdate(
    { ticketId: booking.ticketId, status: 'confirmed', checkedInAt: null },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: req.user._id } },
    { returnDocument: 'after' }
  );
  if (!updated) return res.status(409).json({ error: 'This booking changed while you were cancelling. Refresh and try again.' });

  await setSeats(booking.eventId, booking.seatNumbers, false);
  res.json(updated);
});

// POST /api/bookings/:ticketId/checkin — admin, used by the scanner
// Body: { eventId? } — when given, tickets for other events are rejected.
router.post('/:ticketId/checkin', requireAdmin, async (req, res) => {
  const bookings = getDB().collection('bookings');
  const booking = await findBooking(req.params.ticketId);
  const { qrCode, ...info } = booking || {};

  if (!booking) return res.status(404).json({ result: 'invalid', error: 'No ticket matches this code.' });
  if (req.body?.eventId && String(booking.eventId) !== String(req.body.eventId)) {
    return res.status(409).json({ result: 'wrong_event', error: `This ticket is for ${booking.eventTitle}.`, booking: info });
  }
  if (booking.status === 'cancelled') {
    return res.status(409).json({ result: 'cancelled', error: 'This ticket was cancelled.', booking: info });
  }

  const updated = await bookings.findOneAndUpdate(
    { ticketId: booking.ticketId, status: 'confirmed', checkedInAt: null },
    { $set: { checkedInAt: new Date(), checkedInBy: req.user._id } },
    { returnDocument: 'after', projection: { qrCode: 0 } }
  );

  if (!updated) {
    const latest = await bookings.findOne({ ticketId: booking.ticketId }, { projection: { qrCode: 0 } });
    return res.status(409).json({ result: 'already', error: 'This ticket was already used.', booking: latest });
  }
  res.json({ result: 'ok', booking: updated });
});

module.exports = router;
