import type {SpeechSynthesisVoiceLike, WebSpeechEnvironment} from './speech-types.js';

export interface SpeechSettings {
  lang: string;
  /** Voice name; empty uses the browser's default voice for `lang`. */
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

export function defaultSpeechSettings(): SpeechSettings {
  return {lang: 'ja-JP', voice: '', rate: 1, pitch: 1, volume: 1};
}

/** Wraps speechSynthesis. `speak` resolves when the utterance ends or is cancelled. */
export class SynthesisController {
  private settings: SpeechSettings = defaultSpeechSettings();
  private pending = 0;

  public constructor(
    private readonly environment: WebSpeechEnvironment,
    private readonly voiceWaitMs = 1000
  ) {}

  public isSupported(): boolean {
    return this.environment.synthesis !== null;
  }

  public get speaking(): boolean {
    return this.pending > 0 || (this.environment.synthesis?.speaking ?? false);
  }

  public get currentSettings(): Readonly<SpeechSettings> {
    return {...this.settings};
  }

  public configure(settings: Partial<SpeechSettings>): void {
    const next = {...this.settings, ...settings};
    next.rate = clamp(next.rate, 0.1, 10, 'Speech rate');
    next.pitch = clamp(next.pitch, 0, 2, 'Speech pitch');
    next.volume = clamp(next.volume, 0, 1, 'Speech volume');
    this.settings = next;
  }

  /** Voices of this browser; those matching the speech language come first. */
  public voices(): VoiceInfo[] {
    const primary = this.settings.lang.split('-')[0]?.toLowerCase() ?? '';
    const matches = (voice: SpeechSynthesisVoiceLike) => voice.lang.toLowerCase().startsWith(primary) ? 0 : 1;
    return [...(this.environment.synthesis?.getVoices() ?? [])]
      .sort((left, right) => matches(left) - matches(right))
      .map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default,
        localService: voice.localService
      }));
  }

  public speak(text: string): Promise<void> {
    const synthesis = this.environment.synthesis;
    if (!synthesis) return Promise.reject(new Error('Speech synthesis is not supported in this browser.'));
    if (text.trim().length === 0) return Promise.resolve();
    // Chromium loads voices asynchronously; a named voice needs the list, so wait only in that case.
    if (this.settings.voice.trim().length > 0 && synthesis.getVoices().length === 0) {
      return this.voicesReady(this.voiceWaitMs).then(() => this.utter(text));
    }
    return this.utter(text);
  }

  private utter(text: string): Promise<void> {
    const synthesis = this.environment.synthesis;
    if (!synthesis) return Promise.reject(new Error('Speech synthesis is not supported in this browser.'));
    const utterance = this.environment.createUtterance(text);
    utterance.lang = this.settings.lang;
    utterance.voice = this.findVoice(synthesis.getVoices());
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    this.pending += 1;
    return new Promise((resolve, reject) => {
      const finish = (error?: Error) => {
        this.pending = Math.max(0, this.pending - 1);
        if (error) reject(error);
        else resolve();
      };
      utterance.onend = () => finish();
      utterance.onerror = (event) => {
        // Cancelling (stop speaking, or barge-in) is not a failure for the caller.
        if (event.error === 'canceled' || event.error === 'interrupted') finish();
        else finish(new Error(`Speech synthesis error: ${event.error}`));
      };
      synthesis.speak(utterance);
    });
  }

  public cancel(): void {
    this.environment.synthesis?.cancel();
  }

  /** Resolves when the voice list is available, or after `timeoutMs`. */
  public voicesReady(timeoutMs: number): Promise<void> {
    const synthesis = this.environment.synthesis;
    if (!synthesis || synthesis.getVoices().length > 0 || !synthesis.addEventListener) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      synthesis.addEventListener?.('voiceschanged', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private findVoice(voices: SpeechSynthesisVoiceLike[]): SpeechSynthesisVoiceLike | null {
    const name = this.settings.voice.trim();
    if (name.length === 0) return null;
    return voices.find((voice) => voice.name === name) ?? null;
  }
}

function clamp(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a number.`);
  return Math.min(max, Math.max(min, value));
}
