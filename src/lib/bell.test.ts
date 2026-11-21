import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { bellRecording } from "./bell-recording";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

it("embeds the supplied AAC recording in an audio-only M4A container", () => {
  const bytes = atob(bellRecording);
  expect(bytes.slice(8, 12)).toBe("M4A ");
  const size = (offset: number) => Array.from(bytes.slice(offset, offset + 4)).reduce((total, byte) => total * 256 + byte.charCodeAt(0), 0);
  let offset = 0;
  while (offset < bytes.length && bytes.slice(offset + 4, offset + 8) !== "moov") offset += size(offset);
  const metadata = bytes.slice(offset);
  expect(metadata).toContain("soun"); expect(metadata).toContain("mp4a"); expect(metadata).not.toContain("vide"); expect(metadata).not.toContain("hvc1");
});

it("decodes the recording once, plays the original buffer and applies selected volume", async () => {
  const buffer = {} as AudioBuffer;
  const decode = vi.fn().mockResolvedValue(buffer);
  const resume = vi.fn().mockResolvedValue(undefined);
  const source = { buffer: null as AudioBuffer | null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), onended: null as (() => void) | null };
  const gain = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
  vi.stubGlobal("AudioContext", class {
    state = "suspended"; destination = {};
    resume = resume; decodeAudioData = decode;
    createBufferSource = () => source;
    createGain = () => gain;
  });
  const { unlockAudio, ringBell } = await import("./bell");
  await unlockAudio(); await ringBell(0.65);
  expect(decode).toHaveBeenCalledTimes(1); expect(source.buffer).toBe(buffer); expect(source.start).toHaveBeenCalledTimes(1); expect(gain.gain.value).toBe(0.65);
  await ringBell(0);
  expect(decode).toHaveBeenCalledTimes(1); expect(source.start).toHaveBeenCalledTimes(2); expect(gain.gain.value).toBe(0);
  source.onended!(); expect(source.disconnect).toHaveBeenCalled(); expect(gain.disconnect).toHaveBeenCalled();
});

it("allows a decoding retry after an audio error instead of using a substitute sound", async () => {
  const decode = vi.fn().mockRejectedValueOnce(new Error("Unavailable decoder")).mockResolvedValue({});
  vi.stubGlobal("AudioContext", class { state = "running"; decodeAudioData = decode; });
  const { unlockAudio } = await import("./bell");
  await expect(unlockAudio()).rejects.toThrow("Unavailable decoder"); await unlockAudio(); expect(decode).toHaveBeenCalledTimes(2);
});
