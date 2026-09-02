import Tts from 'react-native-tts';

let initialized = false;

async function ensureReady() {
  if (initialized) return;
  try {
    await Tts.setDefaultLanguage('en-US');
    await Tts.setDefaultRate(0.45);
    initialized = true;
  } catch {
    // TTS may be unavailable on some emulators
  }
}

/** Speak text aloud. Honors Settings → voice tips. No-ops if TTS is off or unavailable. */
export async function speak(text: string): Promise<void> {
  if (!text?.trim()) return;
  try {
    const { useSettingsStore } = require('../stores/settingsStore') as typeof import('../stores/settingsStore');
    if (!useSettingsStore.getState().settings.healthTipVoiceEnabled) return;
    await ensureReady();
    await Tts.stop();
    Tts.speak(text.trim());
  } catch {
    // ignore
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Tts.stop();
  } catch {
    // ignore
  }
}
