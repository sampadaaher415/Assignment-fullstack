require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('./db');

const makeSeats = (n) => Array.from({ length: n }, (_, i) => ({ seatNumber: `S${i + 1}`, isBooked: false }));

// Dates relative to today so the demo always has upcoming events.
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function seed() {
  const db = await connectDB();
  await db.collection('events').deleteMany({});
  await db.collection('bookings').deleteMany({});

  const now = new Date();
  const events = [
    { title: 'Tech Conference 2026', category: 'Conference', description: 'Annual technology and innovation conference with talks from founders, engineers and researchers.', date: inDays(12), time: '10:00', venue: 'Shirpur Convention Center', price: 499, seats: makeSeats(36) },
    { title: 'Music Fest Live', category: 'Music', description: 'An evening of live music across indie, fusion and Bollywood, with food stalls open from 5 PM.', date: inDays(20), time: '18:30', venue: 'City Open Grounds', price: 299, seats: makeSeats(48) },
    { title: 'Stand-up Saturday', category: 'Comedy', description: 'Five comics, one mic. A night of new material from the region’s sharpest stand-up acts.', date: inDays(6), time: '20:00', venue: 'The Loft, MG Road', price: 349, seats: makeSeats(24) },
    { title: 'Design Systems Workshop', category: 'Workshop', description: 'A hands-on day building a component library from tokens to documentation. Bring a laptop.', date: inDays(27), time: '09:30', venue: 'Innovation Hub, Room 2', price: 999, seats: makeSeats(18) },
    { title: 'Inter-College Cricket Final', category: 'Sports', description: 'The season decider under lights. Gates open an hour before the first ball.', date: inDays(34), time: '16:00', venue: 'District Stadium', price: 99, seats: makeSeats(60) },
  ].map((e) => ({ ...e, createdAt: now }));

  await db.collection('events').insertMany(events);

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  await db.collection('users').updateOne(
    { email },
    {
      $set: { role: 'admin', passwordHash: await bcrypt.hash(password, 10) },
      $setOnInsert: { name: 'Admin', email, createdAt: now },
    },
    { upsert: true }
  );

  console.log(`Inserted ${events.length} events.`);
  console.log(`Admin login: ${email} / ${password}`);
  await closeDB();
}

seed().catch(async (err) => {
  console.error(err);
  await closeDB();
  process.exit(1);
});
