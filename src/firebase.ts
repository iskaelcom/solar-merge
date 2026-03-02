import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Values come from .env (gitignored) — copy .env.example → .env and fill in
const FIREBASE_CONFIG = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
};

export const isFirebaseConfigured = Object.values(FIREBASE_CONFIG).every(Boolean);

const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(FIREBASE_CONFIG)
    : getApps()[0]
  : null;

export const auth = app ? getAuth(app) : null;
export const db   = app ? getFirestore(app) : null;
