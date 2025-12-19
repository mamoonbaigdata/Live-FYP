import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'pool_monitoring';
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || 'kpi_readings';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_PATH = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const users = readUsers();
  const user = users.find(u => u.username === String(username).trim());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ ok: true, username: user.username });
});

let mongoClient = null;
let mongoDb = null;
let memServer = null;
async function ensureMongo() {
  if (mongoDb) return mongoDb;
  let uri = MONGODB_URI;
  if (!uri) {
    memServer = await MongoMemoryServer.create();
    uri = memServer.getUri();
    console.log(`Started in-memory MongoDB at ${uri}`);
  }
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  }
  if (!mongoClient.topology?.isConnected()) {
    await mongoClient.connect();
  }
  mongoDb = mongoClient.db(MONGO_DB_NAME);
  return mongoDb;
}


// Seed mock history for the last 30 days
async function seedHistory(db) {
  // Check if we have history specifically
  const historyCount = await db.collection(MONGO_COLLECTION).countDocuments({ granularity: 'sim-hour' });
  if (historyCount > 100) return;

  // If we have some data but no history, we might want to preserve it or just add history
  // But simplistic approach: just insert history.

  console.log('Seeding 30 days of history...');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const entries = [];

  // Create 1 entry per hour for the last 30 days to limit size but provide history
  for (let i = 0; i < 30 * 24; i++) {
    const time = now - (30 * 24 - i) * 60 * 60 * 1000;
    const d = new Date(time);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Simulate diurnal temperature and other drifts
    const hour = d.getHours();
    const tempBase = 25 + Math.sin((hour - 4) / 24 * Math.PI * 2) * 2; // Cooler at night, warmer day
    const temp = tempBase + (Math.random() - 0.5);

    const ph = 7.4 + (Math.random() - 0.5) * 0.2;
    const cl = 1.8 + (Math.random() - 0.5) * 0.5;
    const lvl = 85 + (Math.random() - 0.5) * 2;

    entries.push({
      timestamp: time,
      date: dateStr,
      pH: Number(ph.toFixed(2)),
      chlorine: Number(cl.toFixed(2)),
      waterTemperature: Number(temp.toFixed(2)),
      waterLevel: Number(lvl.toFixed(1)),
      granularity: 'sim-hour'
    });
  }

  await db.collection(MONGO_COLLECTION).insertMany(entries);
  console.log(`Seeded ${entries.length} historical entries.`);
}

app.post('/api/kpi', async (req, res) => {
  try {
    const { timestamp, date, pH, chlorine, waterTemperature, waterLevel, granularity } = req.body || {};
    if ([timestamp, date].some(v => v === undefined)) {
      return res.status(400).json({ error: 'timestamp and date required' });
    }
    const db = await ensureMongo();
    // Default granularity to 'raw' if missing
    const doc = { timestamp, date, pH, chlorine, waterTemperature, waterLevel, granularity: granularity || 'raw' };
    await db.collection(MONGO_COLLECTION).insertOne(doc);
    return res.json({ ok: true });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (msg.includes('MONGODB_URI not configured')) {
      return res.status(503).json({ error: 'MongoDB not configured. Set MONGODB_URI env.' });
    }
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/kpi', async (req, res) => {
  try {
    const db = await ensureMongo();
    const limit = Math.min(Number(req.query.limit ?? 100), 20000); // Increased limit
    const filter = {};
    if (req.query.granularity) {
      filter.granularity = req.query.granularity;
    }
    if (req.query.excludeGranularity) {
      // If excluding raw, be stricter: only include known non-raw types
      // This handles legacy data that might be missing the granularity field (which effectively is raw)
      if (req.query.excludeGranularity === 'raw') {
        filter.granularity = { $in: ['sim-hour', '5min'] };
      } else {
        filter.granularity = { ...filter.granularity, $ne: req.query.excludeGranularity };
      }
    }
    const items = await db.collection(MONGO_COLLECTION).find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
    return res.json({ ok: true, items });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (msg.includes('MONGODB_URI not configured')) {
      return res.status(503).json({ error: 'MongoDB not configured. Set MONGODB_URI env.' });
    }
    return res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
  ensureMongo().then(async (db) => {
    console.log(`Mongo connected: db=${MONGO_DB_NAME}, collection=${MONGO_COLLECTION}`);
    await seedHistory(db);
  }).catch(err => {
    console.error('Mongo connection failed:', err.message || err);
  });
});