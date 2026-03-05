import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { User } from 'firebase/auth';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { isSoundEnabled, setSoundEnabled } from '../utils/SoundManager';

type InnerScreen = null | 'privacy' | 'delete';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onDeleteAccount: () => Promise<void>;
}

export function SettingsModal({ visible, onClose, user, onDeleteAccount }: Props) {
  const [inner, setInner] = useState<InnerScreen>(null);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  function toggleSound(val: boolean) {
    setSoundOn(val);
    setSoundEnabled(val);
  }

  function handleClose() {
    setInner(null);
    onClose();
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your leaderboard score and account data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteAccount();
              handleClose();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete account.');
            }
          },
        },
      ],
    );
  }

  return (
    <>
      {/* ── Main settings modal ───────────────────────────────── */}
      <Modal
        transparent
        animationType="fade"
        visible={visible && inner === null}
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={s.backdrop}>
          <View style={s.card}>
            <View style={s.header}>
              <Text style={s.title}>⚙️  Settings</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
              <Text style={s.sectionLabel}>SOUND</Text>

              <View style={s.row}>
                <Text style={s.rowIcon}>🔊</Text>
                <Text style={s.rowLabel}>Sound Effects</Text>
                <Switch
                  value={soundOn}
                  onValueChange={toggleSound}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#7c6fff' }}
                  thumbColor={soundOn ? '#fff' : 'rgba(255,255,255,0.6)'}
                />
              </View>

              <Text style={[s.sectionLabel, { marginTop: 8 }]}>LEGAL</Text>

              <TouchableOpacity style={s.row} onPress={() => setInner('privacy')}>
                <Text style={s.rowIcon}>🔒</Text>
                <Text style={s.rowLabel}>Privacy Policy</Text>
                <Text style={s.rowChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.row} onPress={() => setInner('delete')}>
                <Text style={s.rowIcon}>📋</Text>
                <Text style={s.rowLabel}>Data Deletion Info</Text>
                <Text style={s.rowChevron}>›</Text>
              </TouchableOpacity>

              {user && (
                <>
                  <Text style={[s.sectionLabel, { marginTop: 16 }]}>ACCOUNT</Text>

                  <View style={s.accountRow}>
                    <Text style={s.accountName} numberOfLines={1}>
                      {user.displayName ?? user.email ?? 'Signed in'}
                    </Text>
                  </View>

                  <TouchableOpacity style={[s.row, s.deleteRow]} onPress={confirmDelete}>
                    <Text style={s.rowIcon}>🗑️</Text>
                    <Text style={s.deleteLabel}>Delete Account</Text>
                  </TouchableOpacity>
                </>
              )}

              <Text style={[s.sectionLabel, { marginTop: 16 }]}>ABOUT</Text>
              <View style={s.row}>
                <Text style={s.rowIcon}>🪐</Text>
                <Text style={s.rowLabel}>Solar Merge</Text>
                <Text style={s.versionText}>v1.0.0</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Privacy Policy sub-screen ─────────────────────────── */}
      <Modal
        animationType="slide"
        visible={visible && inner === 'privacy'}
        onRequestClose={() => setInner(null)}
        statusBarTranslucent
      >
        <PrivacyPolicyScreen
          onBack={() => setInner(null)}
          onOpenDelete={() => setInner('delete')}
        />
      </Modal>

      {/* ── Delete Account sub-screen ─────────────────────────── */}
      <Modal
        animationType="slide"
        visible={visible && inner === 'delete'}
        onRequestClose={() => setInner(null)}
        statusBarTranslucent
      >
        <DeleteAccountScreen onBack={() => setInner(null)} />
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
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
    maxHeight: '80%',
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
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  closeBtn: { color: 'rgba(255,255,255,0.45)', fontSize: 16, fontWeight: '700' },
  body: { paddingVertical: 8, paddingBottom: 12 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowIcon: { fontSize: 18, width: 30 },
  rowLabel: { flex: 1, color: '#e0e0f0', fontSize: 15 },
  rowChevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20 },
  versionText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  accountRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  accountName: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  deleteRow: { borderBottomWidth: 0 },
  deleteLabel: { flex: 1, color: '#FF5252', fontSize: 15 },
});
