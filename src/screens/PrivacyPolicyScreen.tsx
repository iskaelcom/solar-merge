import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface Props {
  onBack?: () => void;
  onOpenDelete?: () => void;
}

export function PrivacyPolicyScreen({ onBack, onOpenDelete }: Props = {}) {
  function handleBack() {
    if (onBack) { onBack(); return; }
    if (Platform.OS === 'web') window.history.back();
  }

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        {(onBack || Platform.OS === 'web') && (
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={s.title}>Privacy Policy</Text>
        <Text style={s.subtitle}>Solar Merge · Last updated March 2026</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Section title="Overview">
          <Body>
            Solar Merge ("we", "us", "our") is a mobile puzzle game. We are committed to being transparent
            about what data we collect and why. This policy covers the Solar Merge Android and web application.
          </Body>
        </Section>

        <Section title="Data We Collect">
          <Body>We collect only the minimum data necessary to operate the features you choose to use:</Body>
          <Bullet>
            <Bold>Google Account info</Bold> (if you sign in): your display name, email address, and profile
            photo URL — used solely to identify you on the leaderboard.
          </Bullet>
          <Bullet>
            <Bold>Game scores and drop counts</Bold>: stored in Firebase Firestore to power the global
            leaderboard.
          </Bullet>
          <Bullet>
            <Bold>Advertising data</Bold>: Google AdMob may collect device identifiers and usage data to serve
            ads. See Google's privacy policy for details.
          </Bullet>
          <Body>We do not collect location data, contacts, camera access, or other sensitive information.</Body>
        </Section>

        <Section title="How We Use Your Data">
          <Bullet>Display your name and score on the in-game leaderboard.</Bullet>
          <Bullet>Allow you to see your ranking among other players.</Bullet>
          <Bullet>Serve advertisements through Google AdMob to support free gameplay.</Bullet>
          <Body>We do not sell, rent, or share your personal data with third parties for marketing.</Body>
        </Section>

        <Section title="Third-Party Services">
          <Body>Solar Merge uses the following third-party services:</Body>
          <Bullet>Firebase / Google Cloud – authentication and Firestore database.</Bullet>
          <Bullet>Google Sign-In – optional sign-in for leaderboard.</Bullet>
          <Bullet>Google AdMob – advertisements.</Bullet>
        </Section>

        <Section title="Data Retention">
          <Body>
            Your leaderboard data (name and score) is retained as long as you have an account. You may delete
            your data at any time.
          </Body>
          {onOpenDelete && (
            <TouchableOpacity onPress={onOpenDelete}>
              <Text style={s.link}>→ How to delete your account</Text>
            </TouchableOpacity>
          )}
        </Section>

        <Section title="Children's Privacy">
          <Body>
            Solar Merge is not directed at children under 13. We do not knowingly collect personal information
            from children under 13.
          </Body>
        </Section>

        <Section title="Your Rights">
          <Bullet>Access the personal data we hold about you.</Bullet>
          <Bullet>Request correction of inaccurate data.</Bullet>
          <Bullet>Request deletion of your data.</Bullet>
          <Bullet>Withdraw consent by deleting your account at any time.</Bullet>
        </Section>

        <Section title="Contact">
          <Body>
            Questions about this privacy policy or your data?{'\n'}
            <Text style={s.email}>iskaeldotcom@gmail.com</Text>
          </Body>
        </Section>

        <Text style={s.footer}>© 2026 Solar Merge. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

// ── Small layout helpers ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={s.bold}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a1e' },
  topBar: {
    backgroundColor: '#12122a',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e40',
  },
  backBtn: { marginBottom: 8 },
  backText: { color: '#a78bfa', fontSize: 14 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 13, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, maxWidth: 720, alignSelf: 'center', width: '100%' },
  section: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1e40',
  },
  sectionTitle: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
    paddingLeft: 10,
  },
  body: { color: '#bbb', fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#ddd' },
  bulletRow: { flexDirection: 'row', marginTop: 6 },
  bulletDot: { color: '#7c3aed', fontSize: 14, marginRight: 8, lineHeight: 22 },
  bulletText: { color: '#bbb', fontSize: 14, lineHeight: 22, flex: 1 },
  link: { color: '#a78bfa', fontSize: 14, marginTop: 8 },
  email: { color: '#a78bfa', fontWeight: '600' },
  footer: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
