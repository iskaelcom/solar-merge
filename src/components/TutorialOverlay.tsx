import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PlanetThumb } from './PlanetView';
import { StarThumb } from './StarView';
import { BlackHoleThumb } from './BlackHoleView';
import { VirusPlanetThumb } from './VirusPlanetView';
import { User } from 'firebase/auth';

// ── Persistence ───────────────────────────────────────────────────────────────
// ... existing markSeen / isTutorialSeen ...

const TUTORIAL_KEY = 'solar-merge-tutorial-v2';

export function isTutorialSeen(): boolean {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(TUTORIAL_KEY) === '1'
    );
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TUTORIAL_KEY, '1');
    }
  } catch { }
}

// ── Slide visuals ─────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <View style={vis.row}>
      {([1, 3, 5, 7, 9, 10] as const).map((id) => (
        <PlanetThumb key={id} planetId={id} size={id === 10 ? 44 : 30} />
      ))}
    </View>
  );
}

function MergeVisual() {
  return (
    <View style={vis.row}>
      <PlanetThumb planetId={3} size={38} />
      <Text style={vis.symbol}>+</Text>
      <PlanetThumb planetId={3} size={38} />
      <Text style={vis.symbol}>→</Text>
      <PlanetThumb planetId={4} size={52} />
    </View>
  );
}

function ComboVisual() {
  const items = [
    { label: 'x1', color: 'rgba(255,255,255,0.55)' },
    { label: 'x2', color: '#FFD600' },
    { label: 'x3', color: '#FF9800' },
    { label: 'x4+', color: '#FF1744' },
  ];
  return (
    <View style={vis.row}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <Text style={[vis.comboText, { color: item.color }]}>{item.label}</Text>
          {i < items.length - 1 && (
            <Text style={vis.chevron}>›</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function ShieldVisual() {
  const bars = [
    { color: '#00E5FF', label: 'Layer 3 — first hit' },
    { color: '#FFD600', label: 'Layer 2' },
    { color: '#FF3D00', label: 'Layer 1 — last defence' },
  ];
  return (
    <View style={{ alignItems: 'center', gap: 7 }}>
      {bars.map((b) => (
        <View key={b.color} style={{ alignItems: 'center', gap: 3 }}>
          <View
            style={{
              width: 200,
              height: 7,
              borderRadius: 4,
              backgroundColor: b.color,
              shadowColor: b.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 8,
            }}
          />
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
            {b.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PowerUpVisual() {
  const items = [
    { node: <StarThumb size={38} />, label: 'Star' },
    { node: <BlackHoleThumb size={38} />, label: 'Black Hole' },
    { node: <VirusPlanetThumb size={38} />, label: 'Virus' },
  ];
  return (
    <View style={vis.row}>
      {items.map((item) => (
        <View key={item.label} style={vis.powerItem}>
          {item.node}
          <Text style={vis.powerLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function DangerVisual() {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Simulated danger line */}
      <View
        style={{
          width: 200,
          height: 2,
          backgroundColor: 'rgba(255,50,50,0.5)',
          marginBottom: 3,
        }}
      />
      <Text style={{ color: 'rgba(255,80,80,0.7)', fontSize: 10, marginBottom: 10 }}>
        ⚠️ Danger Zone
      </Text>
      {/* Planets stacked up */}
      <View style={vis.row}>
        {([6, 4, 2, 1] as const).map((id, i) => (
          <View key={id} style={{ transform: [{ translateY: i * 3 }] }}>
            <PlanetThumb planetId={id} size={30} />
          </View>
        ))}
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 8 }}>
        Keep planets below the line!
      </Text>
    </View>
  );
}

function ReadyVisual() {
  return (
    <View style={vis.row}>
      {([1, 3, 5, 8, 10] as const).map((id, i) => (
        <View
          key={id}
          style={{ transform: [{ translateY: i % 2 === 0 ? -5 : 5 }] }}
        >
          <PlanetThumb planetId={id} size={i === 2 ? 44 : 30} />
        </View>
      ))}
    </View>
  );
}

function LeaderboardVisual({ user, onSignIn }: { user: User | null; onSignIn?: () => void }) {
  if (user) {
    return (
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 40 }}>✅</Text>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
          Logged in as {user.displayName || 'Explorer'}!
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Text style={{ fontSize: 36 }}>🏆</Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
        onPress={onSignIn}
      >
        <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>
          Sign in with Google
        </Text>
      </TouchableOpacity>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>
        Participate in the global rankings!
      </Text>
    </View>
  );
}

const vis = StyleSheet.create({
  // ... styles ...
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbol: { color: '#fff', fontSize: 20, fontWeight: '700', marginHorizontal: 2 },
  chevron: { color: 'rgba(255,255,255,0.5)', fontSize: 18 },
  comboText: { fontSize: 22, fontWeight: '800' },
  powerItem: { alignItems: 'center', gap: 5, marginHorizontal: 10 },
  powerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
});

// ── Slide data ────────────────────────────────────────────────────────────────

interface Slide {
  title: string;
  body: string;
  visual: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: 'Welcome to Solar Merge!',
    body: 'Build your solar system by merging planets. The bigger the planet you create, the more points you earn!',
    visual: <WelcomeVisual />,
  },
  {
    title: 'Drop & Merge',
    body: 'Drag left or right to aim, then release to drop a planet. Two identical planets touching each other will merge into a bigger one!',
    visual: <MergeVisual />,
  },
  {
    title: 'Build Your Combo!',
    body: 'Chain merges quickly to multiply your score. A 3x combo triples your points — keep the chain alive!',
    visual: <ComboVisual />,
  },
  {
    title: 'Combo Shield',
    body: 'Reach combo 5×, 7×, or 9× to earn a 3-layer protective shield. Each planet that bounces off removes one layer. Survive longer!',
    visual: <ShieldVisual />,
  },
  {
    title: 'Special Power-Ups',
    body: '⭐ Star — upgrades a planet one level\n⚫ Black Hole — destroys nearby planets\n🦠 Virus — infects a planet. Sick planets downgrade instead of upgrading on merge!',
    visual: <PowerUpVisual />,
  },
  {
    title: '⚠️ Danger Zone',
    body: "If planets pile up past the red line at the top for too long, it's Game Over. Keep merging to clear space!",
    visual: <DangerVisual />,
  },
  {
    title: "Global Leaderboard 🏆",
    body: "Compete with players worldwide! Sign in with Google to save your high scores and see your rank in the hall of fame.",
    visual: 'leaderboard', // Special marker
  },
  {
    title: "Ready to Launch? 🚀",
    body: 'Merge your way from the Moon all the way to the Sun. The universe awaits — good luck, explorer!',
    visual: <ReadyVisual />,
  },
];

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onDone: () => void;
  user: User | null;
  onSignIn?: () => void;
}

export function TutorialOverlay({ visible, onDone, user, onSignIn }: Props) {
  const [page, setPage] = useState(0);

  const isFirst = page === 0;
  const isLast = page === SLIDES.length - 1;
  const slide = SLIDES[page];

  let visual = slide.visual;
  if (visual === 'leaderboard') {
    visual = <LeaderboardVisual user={user} onSignIn={onSignIn} />;
  }

  function handleNext() {
    if (isLast) {
      markSeen();
      onDone();
      setPage(0);
    } else {
      setPage((p) => p + 1);
    }
  }

  function handleBack() {
    setPage((p) => Math.max(0, p - 1));
  }

  function handleSkip() {
    markSeen();
    onDone();
    setPage(0);
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Skip */}
          {!isLast && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Visual */}
          <View style={styles.visualArea}>{visual}</View>

          {/* Text */}
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>

          {/* Progress dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          {/* Navigation */}
          <View style={styles.navRow}>
            {!isFirst && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, isLast && styles.nextBtnLast]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>
                {isLast ? "Let's Play! 🚀" : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
    padding: 24,
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  visualArea: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  backText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#2e2e70',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnLast: {
    backgroundColor: '#5535c8',
  },
  nextText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
