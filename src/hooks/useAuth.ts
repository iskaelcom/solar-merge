import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
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

// At least one platform client ID must be set (web, iOS, or Android)
export const isAuthConfigured =
  isFirebaseConfigured &&
  (Boolean(GOOGLE_CLIENT_IDS.webClientId) ||
    Boolean(GOOGLE_CLIENT_IDS.iosClientId) ||
    Boolean(GOOGLE_CLIENT_IDS.androidClientId));

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // expo-auth-session — only used on native (iOS / Android).
  // On web we use Firebase's signInWithPopup which handles COOP correctly.
  // Still initialised unconditionally to satisfy React's rules-of-hooks.
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId:        GOOGLE_CLIENT_IDS.webClientId     || 'unconfigured',
    iosClientId:     GOOGLE_CLIENT_IDS.iosClientId     || 'unconfigured',
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId || 'unconfigured',
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

  // Native only: exchange Google id_token → Firebase credential
  useEffect(() => {
    if (Platform.OS === 'web') return; // web uses signInWithPopup
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
      if (Platform.OS === 'web') {
        // Web: Firebase popup handles auth natively — no COOP issues
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // Native: expo-auth-session OAuth flow
        await promptAsync();
      }
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
