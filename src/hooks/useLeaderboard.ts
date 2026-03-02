import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { calculateChecksum } from '../useGame';

// ─────────────────────────────────────────────────────────────────────────────
// Firestore Security Rules — paste in Firebase Console → Firestore → Rules:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /scores/{userId} {
//       allow read: if true;
//       allow write: if request.auth != null
//         && request.auth.uid == userId
//         // score must be a non-negative integer
//         && request.resource.data.score is int
//         && request.resource.data.score >= 0
//         // dropCount must be a positive integer
//         && request.resource.data.dropCount is int
//         && request.resource.data.dropCount > 0
//         // score can only increase — never decrease (resource==null = first-time write)
//         && (resource == null || request.resource.data.score > resource.data.score)
//         // score-per-drop ratio cap: generous upper bound for legitimate play
//         // (avg max ~1500 per drop even with high combos + sun merges)
//         && request.resource.data.score / request.resource.data.dropCount <= 5000
//         // absolute ceiling — any score above this is implausible
//         && request.resource.data.score <= 5000000;
//     }
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
}

export function useLeaderboard(user: User | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    setFetchError(null);

    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<LeaderboardEntry, 'uid'>),
          }))
        );
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setFetchError(err.message);
      }
    );

    return unsub;
  }, []);

  const submitScore = useCallback(
    async (score: number, checksum: string, dropCount: number) => {
      if (!user || !db || score === 0) return;

      // Verify checksum before submission
      const expected = calculateChecksum(score, dropCount);
      if (checksum !== expected) {
        console.error('Invalid score checksum — submission blocked.');
        return;
      }

      const ref = doc(db, 'scores', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists() || (snap.data().score ?? 0) < score) {
        await setDoc(ref, {
          displayName: user.displayName ?? 'Anonymous',
          photoURL: user.photoURL ?? '',
          score,
          dropCount,
          updatedAt: serverTimestamp(),
        });
      }
    },
    [user]
  );

  // Rank of the current user in the top-10 list (1-based, null if not in top 10)
  const userRank =
    user
      ? (() => {
        const idx = entries.findIndex((e) => e.uid === user.uid);
        return idx >= 0 ? idx + 1 : null;
      })()
      : null;

  return { entries, loading, fetchError, userRank, submitScore };
}
