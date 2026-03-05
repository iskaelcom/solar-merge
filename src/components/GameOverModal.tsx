import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  score: number;
  highScore: number;
  onRestart: () => void;
  userRank?: number | null;
  isSignedIn?: boolean;
  onShowLeaderboard?: () => void;
}

export function GameOverModal({ score, highScore, onRestart, userRank, isSignedIn, onShowLeaderboard }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRestart = () => {
    onRestart();
  };

  const isNewHigh = score >= highScore && score > 0;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#1a1a5e', '#0d0d3a']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.emoji}>💥</Text>
          <Text style={styles.title}>Game Over!</Text>

          {isNewHigh && (
            <View style={styles.newHighBadge}>
              <Text style={styles.newHighText}>🏆 NEW HIGH SCORE!</Text>
            </View>
          )}

          <View style={styles.scoreSection}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Best</Text>
              <Text style={styles.bestValue}>{highScore.toLocaleString()}</Text>
            </View>
          </View>

          {isSignedIn && (
            <TouchableOpacity
              style={[styles.rankBadge, userRank ? styles.rankBadgeTop : styles.rankBadgeOut]}
              onPress={onShowLeaderboard}
              activeOpacity={onShowLeaderboard ? 0.7 : 1}
            >
              <Text style={[styles.rankText, userRank ? styles.rankTextTop : styles.rankTextOut]}>
                {userRank
                  ? `${['🥇', '🥈', '🥉'][userRank - 1] ?? '🏅'} Rank #${userRank} di Leaderboard!`
                  : '📊 Belum masuk Top 10'}
              </Text>
              {onShowLeaderboard && (
                <Text style={styles.rankTapHint}>Tap to view →</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.planetHintRow}>
            <Text style={styles.hintText}>Merge planets to reach the ☀️ Sun!</Text>
          </View>

          <TouchableOpacity
            style={styles.restartBtn}
            onPress={handleRestart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF8A00', '#FF4500']}
              style={styles.restartGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.restartText}>🚀 Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,15,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: 300,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD600',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  gradient: {
    padding: 28,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  newHighBadge: {
    backgroundColor: 'rgba(255,214,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.5)',
  },
  newHighText: {
    color: '#FFD600',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  bestValue: {
    color: '#FFD600',
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rankBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  rankBadgeTop: {
    backgroundColor: 'rgba(255,214,0,0.15)',
    borderColor: 'rgba(255,214,0,0.45)',
  },
  rankBadgeOut: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rankTextTop: {
    color: '#FFD600',
  },
  rankTextOut: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  rankTapHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    marginTop: 2,
  },
  planetHintRow: {
    marginBottom: 20,
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  restartBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  restartGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  restartText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
