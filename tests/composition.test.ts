import {describe, expect, it} from 'vitest';
import {createWebSpeech, type WebSpeechEvent} from '../src/composition.js';
import {fakeEnvironment} from './helpers/fake-speech.js';

function setup(options?: {recognition?: boolean; synthesis?: boolean}) {
  const fake = fakeEnvironment(options);
  const speech = createWebSpeech({environment: fake.environment});
  const events: WebSpeechEvent[] = [];
  speech.subscribe((event) => events.push(event));
  return {...fake, speech, events};
}

describe('recognition', () => {
  it('configures the recognizer and reports interim and final text', () => {
    const {speech, current, events} = setup();
    speech.setRecognitionLanguage('en-US');
    speech.startListening('once');
    const recognition = current();
    expect(recognition).toMatchObject({lang: 'en-US', continuous: false, interimResults: true});
    expect(speech.listening).toBe(true);
    recognition?.onspeechstart?.();
    recognition?.result([['hel', false]]);
    expect(speech.interimText).toBe('hel');
    recognition?.result([['hello there ', true, 0.8]]);
    expect(speech.lastRecognizedText).toBe('hello there');
    expect(speech.lastConfidence).toBe(0.8);
    expect(speech.interimText).toBe('');
    recognition?.end();
    expect(speech.listening).toBe(false);
    expect(events.map((event) => event.type)).toEqual(['listening', 'speechStart', 'interim', 'final', 'listening']);
  });

  it('restarts after the browser ends a continuous session, until stopped', () => {
    const {speech, current} = setup();
    speech.startListening('continuous');
    const recognition = current();
    recognition?.end();
    recognition?.end();
    expect(recognition?.starts).toBe(3);
    expect(speech.listening).toBe(true);
    speech.stopListening();
    expect(speech.listening).toBe(false);
    expect(recognition?.starts).toBe(3);
  });

  it('stops restarting after a fatal error and reports it', () => {
    const {speech, current} = setup();
    speech.startListening('continuous');
    const recognition = current();
    recognition?.fail('not-allowed');
    recognition?.end();
    expect(recognition?.starts).toBe(1);
    expect(speech.listening).toBe(false);
    expect(speech.lastError).toBe('Microphone access was denied.');
  });

  it('keeps listening in continuous mode after no-speech', () => {
    const {speech, current} = setup();
    speech.startListening('continuous');
    const recognition = current();
    recognition?.fail('no-speech');
    recognition?.end();
    expect(recognition?.starts).toBe(2);
    expect(speech.listening).toBe(true);
  });

  it('listens once and resolves with the first final text', async () => {
    const {speech, current} = setup();
    const heard = speech.listenOnce();
    const recognition = current();
    recognition?.result([['first', true]]);
    recognition?.result([['second', true]]);
    recognition?.end();
    await expect(heard).resolves.toBe('first');
  });

  it('resolves listenOnce with empty text when nothing is recognized', async () => {
    const {speech, current} = setup();
    const heard = speech.listenOnce();
    current()?.fail('no-speech');
    current()?.end();
    await expect(heard).resolves.toBe('');
  });

  it('aborts immediately and ignores late events from the old recognizer', () => {
    const {speech, current, events} = setup();
    speech.startListening('once');
    const recognition = current();
    speech.abortListening();
    expect(recognition?.aborts).toBe(1);
    expect(speech.listening).toBe(false);
    recognition?.result([['late', true]]);
    expect(speech.lastRecognizedText).toBe('');
    expect(events.filter((event) => event.type === 'final')).toEqual([]);
  });

  it('reports missing support and rejects bad language tags', async () => {
    const {speech} = setup({recognition: false});
    expect(speech.isRecognitionSupported()).toBe(false);
    expect(() => speech.startListening('once')).toThrow('not supported');
    await expect(speech.listenOnce()).rejects.toThrow('not supported');
    expect(() => speech.setRecognitionLanguage('日本語')).toThrow('ja-JP');
  });
});

describe('synthesis', () => {
  it('speaks with the configured settings and resolves at the end', async () => {
    const {speech, synthesis, events} = setup();
    speech.configureSpeech({lang: 'en-US', voice: 'Samantha', rate: 20, pitch: 1.5, volume: 0.5});
    const spoken = speech.speak('Hello');
    const utterance = synthesis.spoken[0];
    expect(utterance).toMatchObject({text: 'Hello', lang: 'en-US', rate: 10, pitch: 1.5, volume: 0.5});
    expect(utterance?.voice?.name).toBe('Samantha');
    expect(speech.speaking).toBe(true);
    synthesis.finish();
    await spoken;
    expect(speech.speaking).toBe(false);
    expect(events.filter((event) => event.type === 'speaking')).toEqual([
      {type: 'speaking', speaking: true},
      {type: 'speaking', speaking: false}
    ]);
  });

  it('treats cancelling as a normal end', async () => {
    const {speech} = setup();
    const spoken = speech.speak('long text');
    speech.cancelSpeech();
    await expect(spoken).resolves.toBeUndefined();
    expect(speech.speaking).toBe(false);
  });

  it('rejects real synthesis errors', async () => {
    const {speech, synthesis} = setup();
    const spoken = speech.speak('x');
    synthesis.spoken[0]?.onerror?.({error: 'synthesis-failed'});
    await expect(spoken).rejects.toThrow('synthesis-failed');
    expect(speech.lastError).toContain('synthesis-failed');
  });

  it('skips empty text, falls back to the default voice, and lists voices', async () => {
    const {speech, synthesis} = setup();
    await speech.speak('   ');
    expect(synthesis.spoken).toHaveLength(0);
    speech.configureSpeech({voice: 'Nobody'});
    void speech.speak('x');
    expect(synthesis.spoken[0]?.voice).toBeNull();
    expect(speech.voices().map((voice) => voice.name)).toEqual(['Kyoko', 'Samantha']);
    expect(() => speech.configureSpeech({rate: Number.NaN})).toThrow('must be a number');
  });

  it('waits for voices that load after the page starts', async () => {
    const {speech, synthesis} = setup();
    const voices = synthesis.voicesList;
    synthesis.voicesList = [];
    speech.configureSpeech({voice: 'Samantha'});
    const spoken = speech.speak('late voices');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(synthesis.spoken).toHaveLength(0);
    synthesis.loadVoices(voices);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(synthesis.spoken[0]?.voice?.name).toBe('Samantha');
    synthesis.finish();
    await spoken;
  });

  it('lists voices for the speech language first', () => {
    const {speech} = setup();
    speech.configureSpeech({lang: 'en-US'});
    expect(speech.voices().map((voice) => voice.name)).toEqual(['Samantha', 'Kyoko']);
  });

  it('reports missing synthesis support', async () => {
    const {speech} = setup({synthesis: false});
    expect(speech.isSynthesisSupported()).toBe(false);
    await expect(speech.speak('x')).rejects.toThrow('not supported');
  });

  it('release stops listening and speaking', () => {
    const {speech, synthesis, current} = setup();
    speech.startListening('continuous');
    void speech.speak('x');
    speech.release();
    expect(current()?.aborts).toBe(1);
    expect(synthesis.spoken).toHaveLength(0);
  });
});
