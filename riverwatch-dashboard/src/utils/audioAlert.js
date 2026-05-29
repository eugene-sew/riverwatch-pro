/**
 * Web Audio API alert tones — no audio files needed.
 */

function playSOSAlert_once(ctx) {
  const frequencies = [440, 554, 659];
  let time = ctx.currentTime;
  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.start(time);
    osc.stop(time + 0.4);
    time += 0.45;
  });
}

export function playSOSAlert() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    playSOSAlert_once(ctx);
    setTimeout(() => playSOSAlert_once(ctx), 1500);
    setTimeout(() => playSOSAlert_once(ctx), 3000);
  } catch (e) {
    console.warn('Audio alert failed:', e);
  }
}

export function playAlertTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Alert tone failed:', e);
  }
}
