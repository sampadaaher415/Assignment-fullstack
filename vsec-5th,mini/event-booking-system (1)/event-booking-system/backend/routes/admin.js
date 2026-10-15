const express = require('express');
const { getDB } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { toObjectId, todayISO } = require('../utils/helpers');

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const db = getDB();
  const [events, upcoming, totals] = await Promise.all([
    db.collection('events').countDocuments(),
    db.collection('events').countDocuments({ date: { $gte: todayISO() } }),
    db.collection('bookings').aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          seatsSold: { $sum: { $size: '$seatNumbers' } },
          revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
          checkedIn: { $sum: { $cond: [{ $ifNull: ['$checkedInAt', false] }, 1, 0] } },
        },
      },
    ]).toArray(),
  ]);
  const t = totals[0] || { bookings: 0, seatsSold: 0, revenue: 0, checkedIn: 0 };
  res.json({ events, upcoming, bookings: t.bookings, seatsSold: t.seatsSold, revenue: t.revenue, checkedIn: t.checkedIn });
});

// GET /api/admin/events/:id/bookings
router.get('/events/:id/bookings', async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid event id.' });
  const bookings = await getDB()
    .collection('bookings')
    .find({ eventId: id }, { projection: { qrCode: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(bookings);
});

module.exports = router;
