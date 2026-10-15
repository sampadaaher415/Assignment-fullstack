const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'eventBookingDB';

const client = new MongoClient(uri);
let db;

async function ensureIndexes(database) {
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('bookings').createIndex({ ticketId: 1 }, { unique: true }),
    database.collection('bookings').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('bookings').createIndex({ eventId: 1, status: 1 }),
    database.collection('events').createIndex({ date: 1 }),
  ]);
}

async function connectDB() {
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized. Call connectDB() first.');
  return db;
}

async function closeDB() {
  await client.close();
}

module.exports = { connectDB, getDB, closeDB };
