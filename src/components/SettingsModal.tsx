import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { User } from 'firebase/auth';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { isSoundEnabled, setSoundEnabled, isAmbientEnabled, setAmbientEnabled } from '../utils/SoundManager';
import Constants from 'expo-constants';

type InnerScreen = null | 'privacy' | 'delete';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onDeleteAccount: () => Promise<void>;
  onRedeemCode: (code: string) => { success: boolean; message: string; amount?: number };
}

export function SettingsModal({ visible, onClose, user, onDeleteAccount, onRedeemCode }: Props) {
  const [inner, setInner] = useState<InnerScreen>(null);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [ambientOn, setAmbientOn] = useState(() => isAmbientEnabled());
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state with SoundManager whenever modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setSoundOn(isSoundEnabled());
      setAmbientOn(isAmbientEnabled());
    }
  }, [visible]);

  function toggleSound(val: boolean) {
    setSoundOn(val);
    setSoundEnabled(val);
  }

  function toggleAmbient(val: boolean) {
    setAmbientOn(val);
    setAmbientEnabled(val);
  }

  function handleClose() {
    setInner(null);
    setRedeemCode('');
    setRedeemStatus(null);
    onClose();
  }

  function handleRedeem() {
    if (!redeemCode.trim()) return;
    const result = onRedeemCode(redeemCode);
    setRedeemStatus(result);
    if (result.success) {
      setRedeemCode('');
    }
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

              <View style={s.row}>
                <Text style={s.rowIcon}>🪐</Text>
                <Text style={s.rowLabel}>Ambient Space Sound</Text>
                <Switch
                  value={ambientOn}
                  onValueChange={toggleAmbient}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#7c6fff' }}
                  thumbColor={ambientOn ? '#fff' : 'rgba(255,255,255,0.6)'}
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

              <Text style={[s.sectionLabel, { marginTop: 16 }]}>REDEEM CODE</Text>
              <View style={s.redeemContainer}>
                <View style={s.redeemRow}>
                  <TextInput
                    style={s.redeemInput}
                    placeholder="Enter code"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={redeemCode}
                    onChangeText={setRedeemCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[s.redeemBtn, !redeemCode.trim() && { opacity: 0.5 }]}
                    onPress={handleRedeem}
                    disabled={!redeemCode.trim()}
                  >
                    <Text style={s.redeemBtnText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
                {redeemStatus && (
                  <Text style={[s.redeemMsg, { color: redeemStatus.success ? '#4CAF50' : '#FF5252' }]}>
                    {redeemStatus.message}
                  </Text>
                )}
              </View>

              <Text style={[s.sectionLabel, { marginTop: 16 }]}>ABOUT</Text>
              <View style={s.row}>
                <Text style={s.rowIcon}>🪐</Text>
                <Text style={s.rowLabel}>Solar Merge</Text>
                <Text style={s.versionText}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
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
  redeemContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  redeemBtn: {
    backgroundColor: '#7c6fff',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  redeemMsg: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
