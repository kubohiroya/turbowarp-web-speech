// Type-checks the published composition API the way a downstream package imports it.
import {createWebSpeech, type VoiceInfo, type WebSpeech, type WebSpeechEvent} from '../dist/types/composition.js';

const speech: WebSpeech = createWebSpeech();
speech.setRecognitionLanguage('ja-JP');
const unsubscribe = speech.subscribe((event: WebSpeechEvent) => {
  if (event.type === 'speechStart') speech.cancelSpeech();
  if (event.type === 'final') void speech.speak(event.text);
});
const voices: VoiceInfo[] = speech.voices();
void voices;
void speech.listenOnce();
unsubscribe();
speech.release();
