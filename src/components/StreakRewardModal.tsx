import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';

interface Props {
  visible: boolean;
  streak: number;
  reward: number;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function StreakRewardModal({ visible, streak, reward, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={s.backdrop}>
        <Animated.View
          style={[
            s.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* ── Background Glow ─────────────────────────────────── */}
          <Animated.View style={[s.glow, { transform: [{ rotate: rotation }] }]} />

          <Text style={s.streakTitle}>STREAK DAY {streak}</Text>
          
          <View style={s.iconContainer}>
            <Text style={s.icon}>✨</Text>
            <View style={s.diamondCircle}>
              <Text style={s.diamondIcon}>💎</Text>
            </View>
          </View>

          <Text style={s.congrats}>Congratulations!</Text>
          <Text style={s.amount}>+{reward} Diamonds</Text>
          <Text style={s.desc}>Thanks for playing daily!</Text>

          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.btnText}>AWESOME!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#1a1a4a',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderRadius: 250,
    top: -100,
    zIndex: -1,
  },
  streakTitle: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 229, 255, 0.5)',
    textShadowRadius: 8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
    position: 'absolute',
    opacity: 0.8,
  },
  diamondCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  diamondIcon: {
    fontSize: 40,
  },
  congrats: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  amount: {
    color: '#FFD600',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  desc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#00E5FF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 100,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
