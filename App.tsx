// Polyfill minimum globals required by matter-js only if they don't exist
if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({ getContext: () => null, style: {} }),
    createElementNS: () => ({ style: {} }),
    addEventListener: () => { },
    removeEventListener: () => { },
  } as any;
}

import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/components/GameScreen';
import { initAdMob } from './src/utils/AdMobManager';
import { initSounds, startAmbientAlien } from './src/utils/SoundManager';
import { AdMobBanner } from './src/components/AdMobBanner';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { DeleteAccountScreen } from './src/screens/DeleteAccountScreen';

// Resolve web-only sub-routes (e.g. /solar-merge/privacy-policy)
function getWebRoute(): string | null {
  if (Platform.OS !== 'web') return null;
  const path = window.location.pathname.replace(/^\/solar-merge/, '').replace(/\/$/, '');
  return path || null;
}

export default function App() {
  const route = getWebRoute();

  // Render standalone pages for web sub-routes
  if (route === '/privacy-policy') return <PrivacyPolicyScreen />;
  if (route === '/delete-account') return <DeleteAccountScreen />;

  useEffect(() => {
    initAdMob();
    initSounds().then(() => {
      startAmbientAlien();
    });
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
