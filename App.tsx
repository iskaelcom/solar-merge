import React from 'react';
import { Platform } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <WithSkiaWeb
        getComponent={() => import('./src/AppMain')}
        opts={{
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.39.1/bin/full/${file}`,
        }}
        fallback={<div style={{ flex: 1, backgroundColor: '#0a0a2e' }} />}
      />
    );
  }

  const AppMainComp = require('./src/AppMain').default;
  return <AppMainComp />;
}
