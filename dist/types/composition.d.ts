/**
 * Composition API: browser speech recognition and synthesis without TurboWarp block definitions.
 *
 * Importing this module does not register a TurboWarp extension and does not touch the `Scratch`
 * global. Everything runs in the browser; no API key or server of this package is involved.
 */
import { type ListenMode, type RecognitionEvent } from './recognition.js';
import { type WebSpeechEnvironment } from './speech-types.js';
import { type SpeechSettings, type VoiceInfo } from './synthesis.js';
export type { ListenMode } from './recognition.js';
export type { SpeechSettings, VoiceInfo } from './synthesis.js';
export type { SpeechRecognitionLike, SpeechSynthesisLike, SpeechSynthesisUtteranceLike, SpeechSynthesisVoiceLike, WebSpeechEnvironment } from './speech-types.js';
export { browserEnvironment } from './speech-types.js';
export type WebSpeechEvent = RecognitionEvent | {
    type: 'speaking';
    speaking: boolean;
};
export type WebSpeechListener = (event: WebSpeechEvent) => void;
export interface WebSpeechOptions {
    /** Defaults to the real browser APIs. */
    environment?: WebSpeechEnvironment;
}
export interface WebSpeech {
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
export declare function createWebSpeech(options?: WebSpeechOptions): WebSpeech;
