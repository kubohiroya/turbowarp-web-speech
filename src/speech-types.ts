/** The narrow slices of the Web Speech API this package uses, so tests can provide fakes. */

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {readonly length: number; [index: number]: SpeechRecognitionResultLike};
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechSynthesisVoiceLike {
  readonly name: string;
  readonly lang: string;
  readonly default: boolean;
  readonly localService: boolean;
}

export interface SpeechSynthesisUtteranceLike {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoiceLike | null;
  rate: number;
  pitch: number;
  volume: number;
  onend: (() => void) | null;
  onerror: ((event: {error: string}) => void) | null;
}

export interface SpeechSynthesisLike {
  readonly speaking: boolean;
  speak(utterance: SpeechSynthesisUtteranceLike): void;
  cancel(): void;
  getVoices(): SpeechSynthesisVoiceLike[];
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
}

export interface WebSpeechEnvironment {
  /** Returns a new recognizer, or null when the browser has no SpeechRecognition. */
  createRecognition(): SpeechRecognitionLike | null;
  /** The synthesis service, or null when the browser has no speechSynthesis. */
  synthesis: SpeechSynthesisLike | null;
  createUtterance(text: string): SpeechSynthesisUtteranceLike;
}

/** The real browser environment. Chrome and Safari expose recognition as webkitSpeechRecognition. */
export function browserEnvironment(): WebSpeechEnvironment {
  const scope = globalThis as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    speechSynthesis?: SpeechSynthesisLike;
    SpeechSynthesisUtterance?: new (text: string) => SpeechSynthesisUtteranceLike;
  };
  const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  const Utterance = scope.SpeechSynthesisUtterance;
  return {
    createRecognition: () => (Recognition ? new Recognition() : null),
    synthesis: scope.speechSynthesis && Utterance ? scope.speechSynthesis : null,
    createUtterance: (text) => {
      if (!Utterance) throw new Error('Speech synthesis is not supported in this browser.');
      return new Utterance(text);
    }
  };
}
