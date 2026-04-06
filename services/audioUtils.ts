import { Blob } from '@google/genai';

export const AUDIO_INPUT_SAMPLE_RATE = 16000;
export const AUDIO_OUTPUT_SAMPLE_RATE = 24000;

/**
 * Converts a base64 string to a Uint8Array.
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a base64 string.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio data (Int16) from the API into an AudioBuffer.
 */
export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const bytes = base64ToBytes(base64Data);
  const dataInt16 = new Int16Array(bytes.buffer);
  
  // Create buffer: 1 channel, length matching data, API output rate (24k)
  const buffer = ctx.createBuffer(1, dataInt16.length, AUDIO_OUTPUT_SAMPLE_RATE);
  const channelData = buffer.getChannelData(0);
  
  // Convert Int16 to Float32
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}

/**
 * Encodes raw PCM audio data (Float32 from Mic) into the format expected by the API (base64 wrapped).
 */
export function createAudioBlob(inputData: Float32Array): Blob {
  const l = inputData.length;
  const int16 = new Int16Array(l);
  
  // Downsample/Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, inputData[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  return {
    data: bytesToBase64(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${AUDIO_INPUT_SAMPLE_RATE}`,
  };
}

/**
 * Creates a silent audio buffer blob.
 * @param durationMs Duration of silence in milliseconds.
 */
export function createSilentAudio(durationMs: number = 100): Blob {
  const sampleRate = AUDIO_INPUT_SAMPLE_RATE;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const silence = new Float32Array(numSamples);
  return createAudioBlob(silence);
}