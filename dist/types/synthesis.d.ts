import type { WebSpeechEnvironment } from './speech-types.js';
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
export declare function defaultSpeechSettings(): SpeechSettings;
/** Wraps speechSynthesis. `speak` resolves when the utterance ends or is cancelled. */
export declare class SynthesisController {
    private readonly environment;
    private readonly voiceWaitMs;
    private settings;
    private pending;
    constructor(environment: WebSpeechEnvironment, voiceWaitMs?: number);
    isSupported(): boolean;
    get speaking(): boolean;
    get currentSettings(): Readonly<SpeechSettings>;
    configure(settings: Partial<SpeechSettings>): void;
    /** Voices of this browser; those matching the speech language come first. */
    voices(): VoiceInfo[];
    speak(text: string): Promise<void>;
    private utter;
    cancel(): void;
    /** Resolves when the voice list is available, or after `timeoutMs`. */
    voicesReady(timeoutMs: number): Promise<void>;
    private findVoice;
}
