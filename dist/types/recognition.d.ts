import type { WebSpeechEnvironment } from './speech-types.js';
export type ListenMode = 'once' | 'continuous';
export type RecognitionEvent = {
    type: 'listening';
    listening: boolean;
} | {
    type: 'speechStart';
} | {
    type: 'interim';
    text: string;
} | {
    type: 'final';
    text: string;
    confidence: number;
} | {
    type: 'error';
    error: string;
    message: string;
};
export interface RecognitionOptions {
    lang: string;
    mode: ListenMode;
    interimResults: boolean;
}
/**
 * Wraps SpeechRecognition. In continuous mode the browser still ends the session after silence, so
 * the controller restarts it until `stop()` is called or a fatal error occurs.
 */
export declare class RecognitionController {
    private readonly environment;
    private readonly emit;
    private recognition;
    private wanted;
    private active;
    private options;
    constructor(environment: WebSpeechEnvironment, emit: (event: RecognitionEvent) => void);
    isSupported(): boolean;
    get listening(): boolean;
    start(options: RecognitionOptions): void;
    /** Stops listening and delivers any pending final result. */
    stop(): void;
    /** Stops listening immediately and discards pending results. */
    abort(): void;
    private handleResult;
    private setActive;
}
