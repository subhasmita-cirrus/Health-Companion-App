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

/** Speak text aloud. No-ops safely if TTS is unavailable. */
export async function speak(text: string): Promise<void> {
  if (!text?.trim()) return;
  try {
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
