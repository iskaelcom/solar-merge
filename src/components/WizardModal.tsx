import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  diamonds: number;
  shrinkCost: number;
  shrinkTimeLeft: number;
  onBuyShrink: () => void;
}

export const WizardModal = ({
  visible,
  onClose,
  diamonds,
  shrinkCost,
  shrinkTimeLeft,
  onBuyShrink,
}: Props) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.title}>🪄  Magic Shop</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <Text style={s.sectionLabel}>PURCHASE</Text>
            <View style={s.row}>
              <Text style={s.rowIcon}>💎</Text>
              <Text style={s.rowLabel}>Your Diamonds</Text>
              <Text style={s.diamondValueText}>{diamonds}</Text>
            </View>

            <Text style={[s.sectionLabel, { marginTop: 12 }]}>AVAILABLE SPELLS</Text>

            <View style={s.spellRow}>
              <View style={s.spellInfo}>
                <View style={s.nameRow}>
                  <Text style={s.spellIcon}>🧪</Text>
                  <Text style={s.spellLabel}>Planet Shrink</Text>
                  {shrinkTimeLeft > 0 && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeText}>
                        {Math.floor(shrinkTimeLeft / 60)}:{(shrinkTimeLeft % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={s.spellDesc}>
                  Shrinks planets ID 4 to 10 to 80% of original size for 5 mins
                </Text>
              </View>

              {shrinkTimeLeft < 60 ? (
                <TouchableOpacity
                  style={[s.buyButton, diamonds < shrinkCost && s.buyButtonDisabled]}
                  onPress={onBuyShrink}
                  disabled={diamonds < shrinkCost}
                  activeOpacity={0.7}
                >
                  <Text style={s.buyButtonText}>{shrinkCost} 💎</Text>
                </TouchableOpacity>
              ) : (
                <View style={[s.buyButton, s.buyButtonActive]}>
                  <Text style={s.buyButtonText}>ACTIVE</Text>
                </View>
              )}
            </View>

            {/* Placeholder for future spells */}
            <View style={[s.spellRow, { opacity: 0.3, borderBottomWidth: 0 }]}>
              <View style={s.spellInfo}>
                <View style={s.nameRow}>
                  <Text style={s.spellIcon}>🔒</Text>
                  <Text style={s.spellLabel}>Locked Spell</Text>
                </View>
                <Text style={s.spellDesc}>Coming soon...</Text>
              </View>
              <View style={[s.buyButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={s.buyButtonText}>???</Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 20, 0.82)',
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
    borderColor: 'rgba(255, 255, 255, 0.10)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  closeBtn: { color: 'rgba(255, 255, 255, 0.45)', fontSize: 16, fontWeight: '700' },
  body: { paddingVertical: 8 },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowIcon: { fontSize: 18, width: 30 },
  rowLabel: { flex: 1, color: '#e0e0f0', fontSize: 15 },
  diamondValueText: { color: '#00E5FF', fontSize: 15, fontWeight: '800' },
  
  spellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  spellInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  spellIcon: { fontSize: 18, width: 30 },
  spellLabel: { color: '#e0e0f0', fontSize: 15, fontWeight: '700' },
  spellDesc: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    paddingLeft: 30, // aligning with text label above
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 255, 133, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 133, 0.2)',
  },
  activeText: {
    color: '#00FF85',
    fontSize: 9,
    fontWeight: '900',
  },
  buyButton: {
    backgroundColor: '#7c6fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  buyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
