import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import definitions from '../src/block-definitions.json';
import {createWebSpeech} from '../src/composition.js';
import {RECOGNIZED_OPCODE, SPEECH_STARTS_OPCODE, WebSpeechExtension} from '../src/extension.js';
import {fakeEnvironment} from './helpers/fake-speech.js';

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat'},
    ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'Boolean'},
    Cast: {toString: (value: unknown) => String(value), toNumber: (value: unknown) => Number(value)},
    translate: (message: string | {default: string}) => (typeof message === 'string' ? message : message.default)
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup() {
  const fake = fakeEnvironment();
  const listeners = new Map<string, () => void>();
  const runtime = {
    startHats: vi.fn(),
    on: (event: string, listener: () => void) => listeners.set(event, listener)
  };
  const extension = new WebSpeechExtension({runtime, speech: createWebSpeech({environment: fake.environment})});
  return {...fake, runtime, listeners, extension};
}

describe('WebSpeechExtension', () => {
  it('describes every block, including the dynamic voice menu', () => {
    const {extension} = setup();
    const info = extension.getInfo() as {
      id: string;
      blocks: Array<{opcode: string; blockType: string; isEdgeActivated?: boolean}>;
      menus: Record<string, {items: unknown}>;
    };
    expect(info.id).toBe('kubohiroyawebspeech');
    expect(info.blocks).toHaveLength(definitions.blocks.length);
    for (const block of info.blocks) {
      expect(typeof (extension as unknown as Record<string, unknown>)[block.opcode]).toBe('function');
      if (block.blockType === 'hat') expect(block.isEdgeActivated).toBe(false);
    }
    expect(info.menus.voices?.items).toBe('voiceMenu');
    expect(extension.voiceMenu()).toEqual([
      {text: '(default)', value: ''},
      {text: 'Kyoko (ja-JP)', value: 'Kyoko'},
      {text: 'Samantha (en-US)', value: 'Samantha'}
    ]);
  });

  it('starts hats for recognized speech and for the start of speech', () => {
    const {extension, runtime, current} = setup();
    extension.startListening({MODE: 'continuous'});
    expect(extension.isListening()).toBe(true);
    current()?.onspeechstart?.();
    current()?.result([['こんにちは', true]]);
    expect(runtime.startHats.mock.calls.map(([opcode]) => opcode)).toEqual([SPEECH_STARTS_OPCODE, RECOGNIZED_OPCODE]);
    expect(extension.recognizedText()).toBe('こんにちは');
  });

  it('listens and waits for one utterance', async () => {
    const {extension, current} = setup();
    const heard = extension.listenAndWait();
    current()?.result([['はい', true]]);
    current()?.end();
    await expect(heard).resolves.toBe('はい');
  });

  it('speaks and waits, and stop speaking ends it early', async () => {
    const {extension, synthesis} = setup();
    extension.setSpeechRate({RATE: '1.5'});
    const spoken = extension.speakAndWait({TEXT: 'やあ'});
    expect(synthesis.spoken[0]?.rate).toBe(1.5);
    expect(extension.isSpeaking()).toBe(true);
    extension.stopSpeaking();
    await spoken;
    expect(extension.isSpeaking()).toBe(false);
    expect(extension.lastError()).toBe('');
  });

  it('releases the microphone and silences speech when the project stops', () => {
    const {extension, listeners, current, synthesis} = setup();
    extension.startListening({MODE: 'continuous'});
    extension.speak({TEXT: 'x'});
    listeners.get('PROJECT_STOP_ALL')?.();
    expect(current()?.aborts).toBe(1);
    expect(extension.isListening()).toBe(false);
    expect(synthesis.spoken).toHaveLength(0);
  });

  it('records errors from settings and recognition', () => {
    const {extension, current} = setup();
    extension.setRecognitionLanguage({LANG: 'not a tag'});
    expect(extension.lastError()).toContain('ja-JP');
    extension.startListening({MODE: 'once'});
    current()?.fail('audio-capture');
    expect(extension.lastError()).toBe('No microphone was found.');
    expect(JSON.parse(extension.voicesJson())).toHaveLength(2);
  });
});
