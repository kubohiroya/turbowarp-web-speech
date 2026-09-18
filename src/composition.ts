/**
 * Composition API: browser speech recognition and synthesis without TurboWarp block definitions.
 *
 * Importing this module does not register a TurboWarp extension and does not touch the `Scratch`
 * global. Everything runs in the browser; no API key or server of this package is involved.
 */
import {RecognitionController, type ListenMode, type RecognitionEvent} from './recognition.js';
import {browserEnvironment, type WebSpeechEnvironment} from './speech-types.js';
import {SynthesisController, type SpeechSettings, type VoiceInfo} from './synthesis.js';

export type {ListenMode} from './recognition.js';
export type {SpeechSettings, VoiceInfo} from './synthesis.js';
export type {
  SpeechRecognitionLike,
  SpeechSynthesisLike,
  SpeechSynthesisUtteranceLike,
  SpeechSynthesisVoiceLike,
  WebSpeechEnvironment
} from './speech-types.js';
export {browserEnvironment} from './speech-types.js';

export type WebSpeechEvent =
  | RecognitionEvent
  | {type: 'speaking'; speaking: boolean};

export type WebSpeechListener = (event: WebSpeechEvent) => void;

export interface WebSpeechOptions {
  /** Defaults to the real browser APIs. */
  environment?: WebSpeechEnvironment;
}

export interface WebSpeech {
  // recognition
  isRecognitionSupported(): boolean;
  setRecognitionLanguage(lang: string): void;
  readonly recognitionLanguage: string;
  startListening(mode: ListenMode): void;
  /** Stops and delivers any pending final result. */
  stopListening(): void;
  /** Stops immediately and discards pending results. */
  abortListening(): void;
  readonly listening: boolean;
  /** Listens for one utterance; resolves with its text, or '' when nothing was recognized. */
  listenOnce(): Promise<string>;
  readonly lastRecognizedText: string;
  readonly interimText: string;
  readonly lastConfidence: number;

  // synthesis
  isSynthesisSupported(): boolean;
  configureSpeech(settings: Partial<SpeechSettings>): void;
  readonly speechSettings: Readonly<SpeechSettings>;
  voices(): VoiceInfo[];
  /** Resolves when the utterance ends or is cancelled. */
  speak(text: string): Promise<void>;
  cancelSpeech(): void;
  readonly speaking: boolean;

  readonly lastError: string;
  subscribe(listener: WebSpeechListener): () => void;
  /** Stops listening and speaking, and detaches listeners. */
  release(): void;
}

export function createWebSpeech(options: WebSpeechOptions = {}): WebSpeech {
  return new WebSpeechImpl(options.environment ?? browserEnvironment());
}

const LANG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/u;

class WebSpeechImpl implements WebSpeech {
  private readonly listeners = new Set<WebSpeechListener>();
  private readonly recognition: RecognitionController;
  private readonly synthesis: SynthesisController;
  private lang = 'ja-JP';
  private lastText = '';
  private interim = '';
  private confidence = 0;
  private error = '';

  public constructor(environment: WebSpeechEnvironment) {
    this.recognition = new RecognitionController(environment, (event) => this.onRecognition(event));
    this.synthesis = new SynthesisController(environment);
  }

  public isRecognitionSupported(): boolean {
    return this.recognition.isSupported();
  }

  public setRecognitionLanguage(lang: string): void {
    this.lang = normalizeLang(lang);
  }

  public get recognitionLanguage(): string {
    return this.lang;
  }

  public startListening(mode: ListenMode): void {
    this.recognition.start({lang: this.lang, mode, interimResults: true});
  }

  public stopListening(): void {
    this.recognition.stop();
  }

  public abortListening(): void {
    this.recognition.abort();
  }

  public get listening(): boolean {
    return this.recognition.listening;
  }

  public listenOnce(): Promise<string> {
    return new Promise((resolve, reject) => {
      let result: string | null = null;
      const unsubscribe = this.subscribe((event) => {
        if (event.type === 'final' && result === null) result = event.text;
        if (event.type === 'listening' && !event.listening) {
          unsubscribe();
          resolve(result ?? '');
        }
      });
      try {
        this.startListening('once');
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    });
  }

  public get lastRecognizedText(): string {
    return this.lastText;
  }

  public get interimText(): string {
    return this.interim;
  }

  public get lastConfidence(): number {
    return this.confidence;
  }

  public isSynthesisSupported(): boolean {
    return this.synthesis.isSupported();
  }

  public configureSpeech(settings: Partial<SpeechSettings>): void {
    const next = {...settings};
    if (next.lang !== undefined) next.lang = normalizeLang(next.lang);
    this.synthesis.configure(next);
  }

  public get speechSettings(): Readonly<SpeechSettings> {
    return this.synthesis.currentSettings;
  }

  public voices(): VoiceInfo[] {
    return this.synthesis.voices();
  }

  public async speak(text: string): Promise<void> {
    this.emit({type: 'speaking', speaking: true});
    try {
      await this.synthesis.speak(text);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      if (!this.synthesis.speaking) this.emit({type: 'speaking', speaking: false});
    }
  }

  public cancelSpeech(): void {
    this.synthesis.cancel();
  }

  public get speaking(): boolean {
    return this.synthesis.speaking;
  }

  public get lastError(): string {
    return this.error;
  }

  public subscribe(listener: WebSpeechListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public release(): void {
    this.recognition.abort();
    this.synthesis.cancel();
    this.listeners.clear();
  }

  private onRecognition(event: RecognitionEvent): void {
    if (event.type === 'final') {
      this.lastText = event.text;
      this.confidence = event.confidence;
      this.interim = '';
    } else if (event.type === 'interim') {
      this.interim = event.text;
    } else if (event.type === 'error') {
      this.error = event.message;
    }
    this.emit(event);
  }

  private emit(event: WebSpeechEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }
}

function normalizeLang(value: string): string {
  const lang = value.trim();
  if (!LANG_PATTERN.test(lang)) throw new TypeError('Language must be a tag such as ja-JP or en-US.');
  return lang;
}
