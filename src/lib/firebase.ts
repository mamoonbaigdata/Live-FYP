import { initializeApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDCaG1vdKoHgMrHbgOCIpU4H3lcQRQpiyk",
  authDomain: "finalyearproject-ede0e.firebaseapp.com",
  databaseURL: "https://finalyearproject-ede0e-default-rtdb.firebaseio.com",
  projectId: "finalyearproject-ede0e",
  storageBucket: "finalyearproject-ede0e.appspot.com",
};

function hasPlaceholders(cfg: typeof firebaseConfig) {
  const values = Object.values(cfg);
  return values.some((v) => typeof v === 'string' && (v.includes('YOUR_PROJECT_ID') || v.includes('YOUR_API_KEY') || v.includes('YOUR_APP_ID') || v.includes('YOUR_MESSAGING_SENDER_ID')));
}

// Initialize Firebase only if config is provided
export const firebaseEnabled = !hasPlaceholders(firebaseConfig);
let app: ReturnType<typeof initializeApp> | null = null;
let db: Database | null = null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
}

export const database = db;
