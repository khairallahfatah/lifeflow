/* ============================================================
   LifeFlow — Audio & Ringtone Engine
   Dual Engine: HTML5 Audio + Web Audio API Synthesizer Fallback
   ============================================================ */

export const SOUND_DEFINITIONS = [
  { id: 'chime', nameAr: 'نغمة هادئة (Chime)', path: '/audio/chime.mp3' },
  { id: 'bell', nameAr: 'جرس كلاسيكي (Bell)', path: '/audio/bell.mp3' },
  { id: 'alert', nameAr: 'تنبيه مميز (Alert)', path: '/audio/alert.mp3' }
];

let audioCtx = null;
let currentAudioElement = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * High-fidelity synthetic chime/bell sound using Web Audio API
 * Ensures zero-latency audio playback even without network or file access
 */
function playSyntheticSound(type = 'chime') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'bell') {
      // Bell: 659.25Hz (E5) + harmonics
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(987.77, now);

      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } else if (type === 'alert') {
      // Alert: High-pitched double ping
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.15);

      gainNode.gain.setValueAtTime(0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Chime: Soft pleasant chord (A5 + E6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1320, now);

      gainNode.gain.setValueAtTime(0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    }
  } catch (err) {
    console.warn('[LifeFlow Audio] Web Audio API synth failed:', err);
  }
}

/**
 * Play a specific sound by ID with automatic HTML5/WebAudio fallback
 * @param {string} soundId - 'chime' | 'bell' | 'alert'
 * @returns {Promise<boolean>}
 */
export async function playSound(soundId = 'chime') {
  const soundDef = SOUND_DEFINITIONS.find((s) => s.id === soundId) || SOUND_DEFINITIONS[0];

  try {
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    }

    const audio = new Audio(soundDef.path);
    currentAudioElement = audio;
    audio.volume = 0.9;

    await audio.play();
    return true;
  } catch (err) {
    // Autoplay restrictions or file load issues -> use Web Audio API Synthesizer
    playSyntheticSound(soundId);
    return true;
  }
}

/**
 * Preview sound with user interaction
 */
export async function previewSound(soundId = 'chime') {
  getAudioContext();
  return playSound(soundId);
}

export function getAvailableSounds() {
  return [...SOUND_DEFINITIONS];
}

export default {
  play: playSound,
  preview: previewSound,
  list: getAvailableSounds
};
