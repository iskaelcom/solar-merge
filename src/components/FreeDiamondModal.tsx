import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  freeGiftsClaimed: string[];
  onClaim: (taskId: string, amount: number) => void;
}

const TASKS = [
  {
    id: 'rate_playstore',
    icon: '⭐',
    title: 'Rate Our Game',
    desc: 'Rate our game on the Play Store',
    amount: 25,
    url: 'market://details?id=com.iskael.solarmerge', // We can update the package name if wrong
  },
  {
    id: 'sub_iskael',
    icon: '▶️',
    title: 'Subscribe Iskael',
    desc: 'Subscribe to Iskael YouTube Channel',
    amount: 20,
    url: 'https://www.youtube.com/@iskael',
  },
  {
    id: 'fb_iskael',
    icon: '📘',
    title: 'Follow Iskael Network',
    desc: 'Follow Fanpage Iskael Network',
    amount: 20,
    url: 'https://www.facebook.com/iskaeldotcom',
  },
  {
    id: 'sub_jagokuis',
    icon: '▶️',
    title: 'Subscribe Jago Kuis',
    desc: 'Subscribe to Jago Kuis YouTube Channel',
    amount: 20,
    url: 'https://www.youtube.com/@jagokuis',
  },
  {
    id: 'tiktok_jagokuis',
    icon: '🎵',
    title: 'Follow Jago Kuis',
    desc: 'Follow TikTok Jago Kuis',
    amount: 20,
    url: 'https://www.tiktok.com/@jagokuis',
  },
  {
    id: 'ig_jagokuis',
    icon: '📸',
    title: 'Follow Jago Kuis',
    desc: 'Follow Instagram Jago Kuis',
    amount: 20,
    url: 'https://www.instagram.com/jagokuis',
  },
];

export const FreeDiamondModal = ({
  visible,
  onClose,
  freeGiftsClaimed,
  onClaim,
}: Props) => {
  const handleTaskPress = (task: typeof TASKS[0]) => {
    if (freeGiftsClaimed.includes(task.id)) return;

    if (task.url) {
      if (Platform.OS === 'web') {
        window.open(task.url, '_blank');
      } else {
        Linking.openURL(task.url).catch(() => { });
      }
    }

    // Give reward immediately
    onClaim(task.id, task.amount);
  };

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
            <Text style={s.title}>🎁  Free Diamonds</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <Text style={s.sectionLabel}>COMPLETE TASKS FOR REWARDS</Text>

            {TASKS.map((task) => {
              const isClaimed = freeGiftsClaimed.includes(task.id);

              return (
                <View key={task.id} style={s.taskRow}>
                  <View style={s.taskInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.taskIcon}>{task.icon}</Text>
                      <Text style={s.taskLabel}>{task.title}</Text>
                    </View>
                    <Text style={s.taskDesc}>{task.desc}</Text>
                  </View>

                  {!isClaimed ? (
                    <TouchableOpacity
                      style={s.claimButton}
                      onPress={() => handleTaskPress(task)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.claimButtonText}>+{task.amount} 💎</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[s.claimButton, s.claimButtonClaimed]}>
                      <Text style={s.claimButtonTextClaimed}>CLAIMED</Text>
                    </View>
                  )}
                </View>
              );
            })}

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
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  taskIcon: { fontSize: 18, width: 22 },
  taskLabel: { color: '#e0e0f0', fontSize: 15, fontWeight: '700' },
  taskDesc: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    paddingLeft: 30, // aligned with icon width (22) + gap (8)
  },
  claimButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  claimButtonClaimed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  claimButtonText: {
    color: '#050514',
    fontSize: 12,
    fontWeight: '900',
  },
  claimButtonTextClaimed: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
