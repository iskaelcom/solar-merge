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
  deleteUser,
  User,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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

// ── Android native Google Sign-In (avoids deprecated implicit OAuth flow) ────
let GoogleSignin: any = null;
let statusCodes: any = null;
if (Platform.OS === 'android') {
  try {
    const pkg = require('@react-native-google-signin/google-signin');
    GoogleSignin = pkg.GoogleSignin;
    statusCodes = pkg.statusCodes;
    if (GOOGLE_CLIENT_IDS.webClientId) {
      GoogleSignin.configure({ webClientId: GOOGLE_CLIENT_IDS.webClientId });
    }
  } catch {}
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // expo-auth-session — only used on iOS and web.
  // Android uses native GoogleSignin to avoid deprecated implicit OAuth flow.
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId:    GOOGLE_CLIENT_IDS.webClientId || 'unconfigured',
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId || 'unconfigured',
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

  // iOS only: exchange Google id_token → Firebase credential
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token && auth) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((e) => setError(e.message));
      }
    }
    if (response?.type === 'error') {
      setError(response.error?.message ?? 'Sign-in failed');
    }
  }, [response]);

  async function signInAndroid() {
    if (!GoogleSignin || !auth) return;
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken ?? (result as any).idToken;
    if (!idToken) throw new Error('No id_token returned from Google');
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  }

  async function signIn() {
    if (!isAuthConfigured) {
      setError('Firebase not configured yet — see src/firebase.ts & src/hooks/useAuth.ts');
      return;
    }
    setError(null);
    try {
      if (Platform.OS === 'web') {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else if (Platform.OS === 'android') {
        await signInAndroid();
      } else {
        await promptAsync();
      }
    } catch (e: any) {
      if (e.code !== statusCodes?.SIGN_IN_CANCELLED) {
        setError(e.message);
      }
    }
  }

  async function signOut() {
    if (!auth) return;
    setError(null);
    if (Platform.OS === 'android' && GoogleSignin) {
      await GoogleSignin.signOut().catch(() => {});
    }
    await fbSignOut(auth);
  }

  async function deleteAccount() {
    if (!auth?.currentUser) return;
    setError(null);
    const uid = auth.currentUser.uid;
    // Delete Firestore score document
    if (db) {
      await deleteDoc(doc(db, 'scores', uid)).catch(() => {});
    }
    // Sign out from Google on Android
    if (Platform.OS === 'android' && GoogleSignin) {
      await GoogleSignin.signOut().catch(() => {});
    }
    // Delete Firebase Auth account
    await deleteUser(auth.currentUser);
  }

  return { user, loading, error, signIn, signOut, deleteAccount };
}
