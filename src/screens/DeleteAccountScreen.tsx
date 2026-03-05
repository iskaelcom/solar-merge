import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export function DeleteAccountScreen({ onBack }: { onBack?: () => void } = {}) {
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
        <Text style={s.title}>Delete Account</Text>
        <Text style={s.subtitle}>Solar Merge · Permanently remove your data</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.warning}>
          <Text style={s.warningTitle}>⚠ This action is permanent</Text>
          <Text style={s.warningBody}>
            Deleting your account will permanently erase your leaderboard score, display name, and all
            associated data. This cannot be undone.
          </Text>
        </View>

        <Section title="What Gets Deleted">
          <Bullet>Your Google sign-in session in the app</Bullet>
          <Bullet>Your leaderboard entry (score, drop count, display name)</Bullet>
          <Bullet>Your Firebase Authentication account linked to Solar Merge</Bullet>
          <Text style={s.note}>Your Google account itself is not deleted — only Solar Merge data.</Text>
        </Section>

        <Section title="Delete From Inside the App">
          <Step num={1}>Open Solar Merge on your device.</Step>
          <Step num={2}>Tap the ⚙️ Settings button in the top-left of the screen.</Step>
          <Step num={3}>Tap "Delete Account" in the Settings panel.</Step>
          <Step num={4}>Confirm the deletion in the dialog. Your data is deleted immediately.</Step>
        </Section>

        <Section title="Request Deletion by Email">
          <Text style={s.body}>
            If you cannot access the app, email us at:
          </Text>
          <Text style={s.email}>iskaeldotcom@gmail.com</Text>
          <Text style={s.body}>
            Subject: <Text style={s.italic}>Delete Account – Solar Merge</Text>{'\n'}
            Include the email address associated with your Google account.{'\n'}
            We will confirm deletion within 7 business days.
          </Text>
        </Section>

        <Section title="Data Retention After Deletion">
          <Text style={s.body}>
            Your data is removed from Firestore immediately. Firebase Authentication records are purged within
            30 days per Google's data retention policies.
          </Text>
        </Section>

        <Text style={s.footer}>© 2026 Solar Merge. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepCircle}>
        <Text style={s.stepNum}>{num}</Text>
      </View>
      <Text style={s.stepText}>{children}</Text>
    </View>
  );
}

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
  title: { color: '#f87171', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 13, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, maxWidth: 720, alignSelf: 'center', width: '100%' },
  warning: {
    backgroundColor: '#1f0808',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningTitle: { color: '#fca5a5', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  warningBody: { color: '#f87171', fontSize: 14, lineHeight: 21 },
  section: {
    backgroundColor: '#12122a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1e40',
  },
  sectionTitle: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    paddingLeft: 10,
  },
  body: { color: '#bbb', fontSize: 14, lineHeight: 22 },
  note: { color: '#666', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  email: { color: '#a78bfa', fontSize: 15, fontWeight: '700', marginVertical: 8 },
  italic: { fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', marginTop: 6 },
  bulletDot: { color: '#dc2626', fontSize: 14, marginRight: 8, lineHeight: 22 },
  bulletText: { color: '#bbb', fontSize: 14, lineHeight: 22, flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, flexShrink: 0,
  },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { color: '#bbb', fontSize: 14, lineHeight: 22, flex: 1, paddingTop: 2 },
  footer: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
