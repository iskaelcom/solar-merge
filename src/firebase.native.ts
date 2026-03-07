import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, type Persistence } from '@firebase/auth';
// getReactNativePersistence only exists in Metro's RN build of @firebase/auth (not in TS types)
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_CONFIG = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
};

export const isFirebaseConfigured = Object.values(FIREBASE_CONFIG).every(Boolean);

const isNewApp = getApps().length === 0;
const app = isFirebaseConfigured
  ? isNewApp ? initializeApp(FIREBASE_CONFIG) : getApps()[0]
  : null;

function getAuthInstance(firebaseApp: ReturnType<typeof initializeApp>) {
  if (isNewApp) {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  return getAuth(firebaseApp);
}

export const auth = app ? getAuthInstance(app) : null;
export const db   = app ? getFirestore(app) : null;
