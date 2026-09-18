import type {
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  SpeechSynthesisLike,
  SpeechSynthesisUtteranceLike,
  SpeechSynthesisVoiceLike,
  WebSpeechEnvironment
} from '../../src/speech-types.js';

export class FakeRecognition implements SpeechRecognitionLike {
  public lang = '';
  public continuous = false;
  public interimResults = false;
  public maxAlternatives = 0;
  public onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  public onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  public onend: (() => void) | null = null;
  public onstart: (() => void) | null = null;
  public onspeechstart: (() => void) | null = null;
  public starts = 0;
  public stops = 0;
  public aborts = 0;

  public start(): void {
    this.starts += 1;
    this.onstart?.();
  }

  public stop(): void {
    this.stops += 1;
    this.onend?.();
  }

  public abort(): void {
    this.aborts += 1;
  }

  /** Delivers results; each entry is [text, isFinal, confidence]. */
  public result(entries: Array<[string, boolean, number?]>, resultIndex = 0): void {
    const results = entries.map(([transcript, isFinal, confidence]) => {
      const result = {isFinal, length: 1, 0: {transcript, confidence: confidence ?? 0.9}};
      return result;
    });
    this.onresult?.({resultIndex, results: Object.assign(results, {length: results.length})});
  }

  public fail(error: string): void {
    this.onerror?.({error});
  }

  /** The browser ends the session (for example after silence). */
  public end(): void {
    this.onend?.();
  }
}

export class FakeUtterance implements SpeechSynthesisUtteranceLike {
  public lang = '';
  public voice: SpeechSynthesisVoiceLike | null = null;
  public rate = 1;
  public pitch = 1;
  public volume = 1;
  public onend: (() => void) | null = null;
  public onerror: ((event: {error: string}) => void) | null = null;
  public constructor(public text: string) {}
}

export class FakeSynthesis implements SpeechSynthesisLike {
  public readonly spoken: FakeUtterance[] = [];
  public voicesList: SpeechSynthesisVoiceLike[] = [
    {name: 'Kyoko', lang: 'ja-JP', default: true, localService: true},
    {name: 'Samantha', lang: 'en-US', default: false, localService: true}
  ];

  public get speaking(): boolean {
    return this.spoken.length > 0;
  }

  public speak(utterance: SpeechSynthesisUtteranceLike): void {
    this.spoken.push(utterance as FakeUtterance);
  }

  public cancel(): void {
    const pending = this.spoken.splice(0);
    for (const utterance of pending) utterance.onerror?.({error: 'interrupted'});
  }

  public getVoices(): SpeechSynthesisVoiceLike[] {
    return this.voicesList;
  }

  private readonly voiceListeners: Array<() => void> = [];

  public addEventListener(_type: 'voiceschanged', listener: () => void): void {
    this.voiceListeners.push(listener);
  }

  /** Simulates Chromium loading voices after the page starts. */
  public loadVoices(voices: SpeechSynthesisVoiceLike[]): void {
    this.voicesList = voices;
    for (const listener of this.voiceListeners.splice(0)) listener();
  }

  /** Finishes the oldest utterance. */
  public finish(): void {
    this.spoken.shift()?.onend?.();
  }
}

export function fakeEnvironment(options: {recognition?: boolean; synthesis?: boolean} = {}) {
  const recognitions: FakeRecognition[] = [];
  const synthesis = new FakeSynthesis();
  const environment: WebSpeechEnvironment = {
    createRecognition: () => {
      if (options.recognition === false) return null;
      const recognition = new FakeRecognition();
      recognitions.push(recognition);
      return recognition;
    },
    synthesis: options.synthesis === false ? null : synthesis,
    createUtterance: (text) => new FakeUtterance(text)
  };
  /** The recognizer most recently started (support checks also create instances). */
  const current = () => [...recognitions].reverse().find((recognition) => recognition.starts > 0);
  return {environment, recognitions, synthesis, current};
}
