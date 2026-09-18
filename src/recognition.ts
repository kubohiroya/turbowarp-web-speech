import type {SpeechRecognitionEventLike, SpeechRecognitionLike, WebSpeechEnvironment} from './speech-types.js';

export type ListenMode = 'once' | 'continuous';

export type RecognitionEvent =
  | {type: 'listening'; listening: boolean}
  | {type: 'speechStart'}
  | {type: 'interim'; text: string}
  | {type: 'final'; text: string; confidence: number}
  | {type: 'error'; error: string; message: string};

export interface RecognitionOptions {
  lang: string;
  mode: ListenMode;
  interimResults: boolean;
}

/** Errors after which restarting in continuous mode would only loop. */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported']);

/**
 * Wraps SpeechRecognition. In continuous mode the browser still ends the session after silence, so
 * the controller restarts it until `stop()` is called or a fatal error occurs.
 */
export class RecognitionController {
  private recognition: SpeechRecognitionLike | null = null;
  private wanted = false;
  private active = false;
  private options: RecognitionOptions = {lang: 'ja-JP', mode: 'once', interimResults: true};

  public constructor(
    private readonly environment: WebSpeechEnvironment,
    private readonly emit: (event: RecognitionEvent) => void
  ) {}

  public isSupported(): boolean {
    return this.environment.createRecognition() !== null;
  }

  public get listening(): boolean {
    return this.active;
  }

  public start(options: RecognitionOptions): void {
    this.stop();
    const recognition = this.environment.createRecognition();
    if (!recognition) throw new Error('Speech recognition is not supported in this browser.');
    this.options = options;
    this.recognition = recognition;
    this.wanted = true;
    recognition.lang = options.lang;
    recognition.continuous = options.mode === 'continuous';
    recognition.interimResults = options.interimResults;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => this.setActive(recognition, true);
    recognition.onspeechstart = () => {
      if (this.recognition === recognition) this.emit({type: 'speechStart'});
    };
    recognition.onresult = (event) => {
      if (this.recognition === recognition) this.handleResult(event);
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition) return;
      // `no-speech` and `aborted` are normal in practice; report them but keep continuous mode alive.
      if (FATAL_ERRORS.has(event.error)) this.wanted = false;
      this.emit({type: 'error', error: event.error, message: describeError(event.error, event.message)});
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      if (this.wanted && this.options.mode === 'continuous') {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through and report that listening ended.
        }
      }
      this.wanted = false;
      this.setActive(recognition, false);
      this.recognition = null;
    };
    recognition.start();
  }

  /** Stops listening and delivers any pending final result. */
  public stop(): void {
    const recognition = this.recognition;
    this.wanted = false;
    if (recognition) recognition.stop();
  }

  /** Stops listening immediately and discards pending results. */
  public abort(): void {
    const recognition = this.recognition;
    this.wanted = false;
    this.recognition = null;
    if (recognition) {
      recognition.abort();
      this.setActive(recognition, false, true);
    }
  }

  private handleResult(event: SpeechRecognitionEventLike): void {
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const best = result?.[0];
      if (!result || !best) continue;
      if (result.isFinal) {
        this.emit({type: 'final', text: best.transcript.trim(), confidence: best.confidence});
      } else {
        interim += best.transcript;
      }
    }
    if (interim.length > 0) this.emit({type: 'interim', text: interim.trim()});
  }

  private setActive(recognition: SpeechRecognitionLike, active: boolean, force = false): void {
    if (!force && this.recognition !== recognition) return;
    if (this.active === active) return;
    this.active = active;
    this.emit({type: 'listening', listening: active});
  }
}

function describeError(error: string, message?: string): string {
  const known: Record<string, string> = {
    'not-allowed': 'Microphone access was denied.',
    'service-not-allowed': 'Speech recognition is not allowed in this browser (it may not work in TurboWarp Desktop).',
    'audio-capture': 'No microphone was found.',
    network: 'The speech recognition service could not be reached.',
    'no-speech': 'No speech was detected.',
    aborted: 'Listening was aborted.',
    'language-not-supported': 'This recognition language is not supported.'
  };
  return known[error] ?? (message && message.length > 0 ? message : `Speech recognition error: ${error}`);
}
