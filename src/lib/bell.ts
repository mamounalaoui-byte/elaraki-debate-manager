let context: AudioContext | null = null;
export async function unlockAudio() {
  context ??= new AudioContext();
  if (context.state !== "running") await context.resume();
}
export async function ringBell(volume: number) {
  await unlockAudio();
  const ctx = context!;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = volume * 0.45;
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor); compressor.connect(ctx.destination);
  // Inharmonic resonances and a short noisy clapper create a metallic cowbell strike.
  [540, 800, 1090, 1620, 2160].forEach((frequency, i) => {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = i < 2 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.8 / (i + 1), now + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.65 / (1 + i * 0.12));
    oscillator.connect(envelope); envelope.connect(master);
    oscillator.start(now); oscillator.stop(now + 0.8);
  });
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length * 0.2));
  const noise = ctx.createBufferSource(); noise.buffer = buffer;
  const filter = ctx.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = 1300;
  noise.connect(filter); filter.connect(master); noise.start(now);
  window.setTimeout(() => { master.disconnect(); compressor.disconnect(); }, 1100);
}
