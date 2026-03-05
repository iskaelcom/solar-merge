/**
 * SoundManager – thin wrapper around expo-av for in-game sound effects.
 *
 * Sounds are pre-loaded once at startup and replayed on demand.
 * Each sound gets its own Sound instance so rapid calls don't cut each other off.
 */

import { Audio } from 'expo-av';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ASSETS = {
  drop:      require('../../assets/sounds/drop.wav')      as number,
  merge:     require('../../assets/sounds/merge.wav')     as number,
  star:      require('../../assets/sounds/star.wav')      as number,
  blackhole: require('../../assets/sounds/blackhole.wav') as number,
  virus:     require('../../assets/sounds/virus.wav')     as number,
  gameover:  require('../../assets/sounds/gameover.wav')  as number,
};

type SoundKey = keyof typeof ASSETS;

const pool: Record<SoundKey, Audio.Sound | null> = {
  drop: null, merge: null, star: null, blackhole: null, virus: null, gameover: null,
};

let initialized = false;

export async function initSounds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  for (const key of Object.keys(ASSETS) as SoundKey[]) {
    try {
      const { sound } = await Audio.Sound.createAsync(ASSETS[key], {
        shouldPlay: false,
        volume: 1,
      });
      pool[key] = sound;
    } catch {
      // Non-fatal — game still works without sound
    }
  }
}

export async function playSound(key: SoundKey): Promise<void> {
  const sound = pool[key];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Ignore playback errors (e.g. audio focus lost)
  }
}
