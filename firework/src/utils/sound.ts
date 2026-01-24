import firework1 from '../sounds/firework1.mp3';
import firework2 from '../sounds/firework2.mp3';
import firework3 from '../sounds/firework3.mp3';

const sounds = [firework1, firework2, firework3];

let audioContext: AudioContext | null = null;
const audioBuffers: AudioBuffer[] = [];
let initialized = false;

async function initAudio(): Promise<void> {
  if (initialized || typeof window === 'undefined') return;

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const loadSound = async (url: string): Promise<AudioBuffer> => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return audioContext!.decodeAudioData(arrayBuffer);
    };

    const buffers = await Promise.all(sounds.map(loadSound));
    audioBuffers.push(...buffers);
    initialized = true;
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
}

export function playRandomFireworkSound(): void {
  if (typeof window === 'undefined') return;

  if (!initialized) {
    initAudio().then(() => {
      playSound();
    });
  } else {
    playSound();
  }
}

function playSound(): void {
  if (!audioContext || audioBuffers.length === 0) return;

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const randomIndex = Math.floor(Math.random() * audioBuffers.length);
  const buffer = audioBuffers[randomIndex];

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
}

export function preloadSounds(): void {
  initAudio();
}
