import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
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
            <View style={s.statsRow}>
              <Text style={s.sectionLabel}>YOUR DIAMONDS</Text>
              <View style={s.diamondBadge}>
                <Text style={s.diamondText}>💎 {diamonds}</Text>
              </View>
            </View>

            <Text style={s.sectionLabel}>AVAILABLE SPELLS</Text>

            <View style={s.row}>
              <View style={s.itemInfo}>
                <View style={s.nameRow}>
                  <Text style={s.rowLabel}>🧪 Planet Shrink</Text>
                  {shrinkTimeLeft > 0 && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeText}>
                        {Math.floor(shrinkTimeLeft / 60)}:{(shrinkTimeLeft % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={s.itemDesc}>
                  Shrinks planets ID 4 to 10 by 80% for 5 minutes.
                </Text>
              </View>

              {shrinkTimeLeft < 60 ? (
                <TouchableOpacity
                  style={[s.buyButton, diamonds < shrinkCost && s.buyButtonDisabled]}
                  onPress={onBuyShrink}
                  disabled={diamonds < shrinkCost}
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
            <View style={[s.row, { opacity: 0.4 }]}>
              <View style={s.itemInfo}>
                <Text style={s.rowLabel}>Locked Spell</Text>
                <Text style={s.itemDesc}>Stay tuned for more magic...</Text>
              </View>
              <View style={[s.buyButton, { backgroundColor: '#333' }]}>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  diamondBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  diamondText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  rowLabel: { color: '#e0e0f0', fontSize: 16, fontWeight: '700' },
  itemDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 16,
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 255, 133, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 133, 0.3)',
  },
  activeText: {
    color: '#00FF85',
    fontSize: 10,
    fontWeight: '900',
  },
  buyButton: {
    backgroundColor: '#7c6fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  buyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
