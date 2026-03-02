import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

// Values come from .env (gitignored) — see .env.example
const GOOGLE_CLIENT_IDS = {
  webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     ?? '',
  iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
};

export const isAuthConfigured =
  isFirebaseConfigured && Object.values(GOOGLE_CLIENT_IDS).every(Boolean);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_IDS.webClientId || undefined,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId || undefined,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId || undefined,
  });

  // Watch Firebase auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Exchange Google token → Firebase credential
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token && auth) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((e) =>
          setError(e.message)
        );
      }
    }
    if (response?.type === 'error') {
      setError(response.error?.message ?? 'Sign-in failed');
    }
  }, [response]);

  async function signIn() {
    if (!isAuthConfigured) {
      setError('Firebase not configured yet — see src/firebase.ts & src/hooks/useAuth.ts');
      return;
    }
    setError(null);
    try {
      await promptAsync();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function signOut() {
    if (!auth) return;
    setError(null);
    await fbSignOut(auth);
  }

  return { user, loading, error, signIn, signOut };
}
