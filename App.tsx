// Polyfill globals required by matter-js in React Native / Hermes environment
if (typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({ getContext: () => null, style: {} }),
    createElementNS: () => ({ style: {} }),
    addEventListener: () => { },
    removeEventListener: () => { },
  };
}

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/components/GameScreen';
import { initAdMob } from './src/utils/AdMobManager';
import { AdMobBanner } from './src/components/AdMobBanner';

export default function App() {
  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.gameContainer}>
        <GameScreen />
      </View>
      <AdMobBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2e',
  },
  gameContainer: {
    flex: 1,
  },
});
