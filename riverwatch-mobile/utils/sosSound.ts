import { Audio } from 'expo-av';

let sosSoundInstance: Audio.Sound | null = null;

/**
 * Play the looping SOS alert sound.
 */
export async function playSOSSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });
    
    if (sosSoundInstance) {
      await sosSoundInstance.stopAsync();
      await sosSoundInstance.unloadAsync();
      sosSoundInstance = null;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../assets/sos_alert.wav'),
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    
    sosSoundInstance = sound;
  } catch (e) {
    console.warn('playSOSSound failed:', e);
  }
}

/**
 * Stop any active SOS sound.
 */
export async function stopSOSSound(): Promise<void> {
  try {
    if (sosSoundInstance) {
      await sosSoundInstance.stopAsync();
      await sosSoundInstance.unloadAsync();
      sosSoundInstance = null;
    }
  } catch (e) {
    console.warn('stopSOSSound failed:', e);
  }
}

/**
 * Play a single, short alert beep for watch status changes.
 */
export async function playAlertBeep(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../assets/sos_alert.wav'),
      { shouldPlay: true, isLooping: false, volume: 0.6 }
    );
    
    // Auto-unload after playback completes
    setTimeout(async () => {
      try {
        await sound.unloadAsync();
      } catch (e) {}
    }, 1500);
  } catch (e) {
    console.warn('playAlertBeep failed:', e);
  }
}
