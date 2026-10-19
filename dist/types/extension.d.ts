import { type WebSpeech } from './composition.js';
export declare const RECOGNIZED_OPCODE: string;
export declare const SPEECH_STARTS_OPCODE: string;
/** The runtime features this extension needs: starting hats and hearing project stop. */
export interface HatRuntime {
    startHats(opcode: string): unknown;
    on(event: string, listener: () => void): void;
}
export interface WebSpeechExtensionDependencies {
    runtime: HatRuntime;
    speech?: WebSpeech;
}
type Args = Record<string, unknown>;
/** Block surface over the Web Speech composition. */
export declare class WebSpeechExtension implements TurboWarpExtension {
    private readonly fixedEditorRuntime;
    private fixedEditorsDispose;
    private lastErrorMessage;
    private readonly speech;
    constructor(deps: WebSpeechExtensionDependencies);
    getInfo(): Record<string, unknown>;
    /** Dynamic menu: the voices of this browser, with an empty entry for the default voice. */
    voiceMenu(): Array<{
        text: string;
        value: string;
    }>;
    isRecognitionSupported(): boolean;
    setRecognitionLanguage(args: Args): void;
    startListening(args: Args): void;
    stopListening(): void;
    isListening(): boolean;
    listenAndWait(): Promise<string>;
    whenSpeechRecognized(): boolean;
    whenSpeechStarts(): boolean;
    recognizedText(): string;
    interimText(): string;
    isSynthesisSupported(): boolean;
    speak(args: Args): void;
    speakAndWait(args: Args): Promise<void>;
    stopSpeaking(): void;
    isSpeaking(): boolean;
    setSpeechLanguage(args: Args): void;
    setSpeechVoice(args: Args): void;
    setSpeechRate(args: Args): void;
    setSpeechPitch(args: Args): void;
    voicesJson(): string;
    lastError(): string;
    private record;
    private toScratchBlock;
}
export {};
