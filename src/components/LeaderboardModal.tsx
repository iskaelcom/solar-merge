import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { User } from 'firebase/auth';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { isAuthConfigured } from '../hooks/useAuth';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  entries: LeaderboardEntry[];
  lbLoading: boolean;
  lbError: string | null;
  userRank: number | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function LeaderboardModal({
  visible,
  onClose,
  user,
  authLoading,
  authError,
  entries,
  lbLoading,
  lbError,
  userRank,
  onSignIn,
  onSignOut,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🏆 Leaderboard</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User info bar */}
          {user ? (
            <View style={styles.userBar}>
              <Avatar uri={user.photoURL} name={user.displayName} size={32} />
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.displayName ?? 'Anonymous'}
                </Text>
                {userRank !== null && (
                  <Text style={styles.userRankText}>Rank #{userRank} in top 10</Text>
                )}
              </View>
              <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.signInBanner}>
              <Text style={styles.signInMsg}>Sign in to save your score to the leaderboard</Text>
            </View>
          )}

          {/* Leaderboard list */}
          {lbLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#FFD600" size="large" />
            </View>
          ) : lbError ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>⚠️ Firestore error:{'\n'}{lbError}</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {isAuthConfigured
                  ? 'No scores yet — be the first!'
                  : 'Configure Firebase in src/firebase.ts to enable the leaderboard'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {entries.map((entry, idx) => {
                const isMe = user?.uid === entry.uid;
                return (
                  <View
                    key={entry.uid}
                    style={[styles.entry, isMe && styles.entryHighlight]}
                  >
                    <Text style={styles.rank}>
                      {idx < 3 ? RANK_MEDALS[idx] : `${idx + 1}`}
                    </Text>
                    <Avatar uri={entry.photoURL} name={entry.displayName} size={28} />
                    <Text style={[styles.entryName, isMe && styles.entryNameMe]} numberOfLines={1}>
                      {entry.displayName}
                      {isMe ? ' (You)' : ''}
                    </Text>
                    <Text style={[styles.entryScore, isMe && styles.entryScoreMe]}>
                      {entry.score.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Error */}
          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}

          {/* Sign in button */}
          {!user && (
            <TouchableOpacity
              style={[styles.googleBtn, authLoading && styles.googleBtnDisabled]}
              onPress={onSignIn}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.googleBtnText}>Sign in with Google</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Avatar helper ─────────────────────────────────────────────────────────────

function Avatar({ uri, name, size }: { uri?: string | null; name?: string | null; size: number }) {
  const [failed, setFailed] = React.useState(false);
  const initials = (name ?? '?').slice(0, 1).toUpperCase();

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#3a3a7a',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.45, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,5,20,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#16163a',
    borderRadius: 22,
    width: '100%',
    maxWidth: 390,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    fontWeight: '700',
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userRankText: { color: '#FFD600', fontSize: 11, marginTop: 1 },
  signOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  signOutText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  signInBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  signInMsg: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
  },
  list: { maxHeight: 320 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  entryHighlight: {
    backgroundColor: 'rgba(255,214,0,0.08)',
  },
  rank: {
    width: 28,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  entryName: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  entryNameMe: { color: '#FFD600', fontWeight: '700' },
  entryScore: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  entryScoreMe: { color: '#FFD600' },
  center: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  googleBtn: {
    margin: 16,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
