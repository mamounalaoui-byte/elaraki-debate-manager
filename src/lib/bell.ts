import { bellRecording } from "./bell-recording";

let context: AudioContext | null = null;
let recording: Promise<AudioBuffer> | null = null;

export async function unlockAudio() {
  context ??= new AudioContext();
  if (context.state !== "running") await context.resume();
  if (!recording) {
    const bytes = Uint8Array.from(atob(bellRecording), character => character.charCodeAt(0));
    recording = context.decodeAudioData(bytes.buffer).catch(error => {
      recording = null;
      throw error;
    });
  }
  await recording;
}

export async function ringBell(volume: number) {
  await unlockAudio();
  const source = context!.createBufferSource();
  const gain = context!.createGain();
  source.buffer = await recording!;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(context!.destination);
  source.onended = () => { source.disconnect(); gain.disconnect(); };
  source.start();
}
