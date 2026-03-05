import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { User } from 'firebase/auth';

const WEB_BASE = 'https://iskaelcom.github.io/solar-merge';

function openPage(path: string) {
  if (Platform.OS === 'web') {
    window.open(`/solar-merge${path}`, '_blank');
  } else {
    Linking.openURL(`${WEB_BASE}${path}`);
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onDeleteAccount: () => Promise<void>;
}

export function SettingsModal({ visible, onClose, user, onDeleteAccount }: Props) {
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
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete account.');
            }
          },
        },
      ],
    );
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>⚙️  Settings</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            {/* Legal section */}
            <Text style={s.sectionLabel}>LEGAL</Text>

            <TouchableOpacity style={s.row} onPress={() => openPage('/privacy-policy')}>
              <Text style={s.rowIcon}>🔒</Text>
              <Text style={s.rowLabel}>Privacy Policy</Text>
              <Text style={s.rowChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.row} onPress={() => openPage('/delete-account')}>
              <Text style={s.rowIcon}>📋</Text>
              <Text style={s.rowLabel}>Data Deletion Info</Text>
              <Text style={s.rowChevron}>›</Text>
            </TouchableOpacity>

            {/* Account section — only visible when signed in */}
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

            {/* About section */}
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
