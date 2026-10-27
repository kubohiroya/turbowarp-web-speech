# TurboWarp-Web-Speech

<img src="assets/block-icon.svg" alt="" width="48" height="48">

English | [日本語](README.ja.md)

A TurboWarp extension for speech recognition and speech synthesis in the browser, using the Web Speech API. It needs no API key and no server of its own.

**User guide:** [English](https://kubohiroya.github.io/turbowarp-web-speech/)

## Minimal demo

[Open in TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-web-speech%2Fsamples%2Fspeak-one-sentence.sb3) · [Download SB3](https://kubohiroya.github.io/turbowarp-web-speech/samples/speak-one-sentence.sb3)

Kyoko is explicitly selected initially; if that Japanese voice is unavailable, the sample stays silent. In Stage code, use the voice dropdown inside “set Voice name to” to select an available Japanese (ja / ja-JP) voice, then click the green flag to apply it. When Japanese voice found is true, click the blue Speak sprite only when you want to hear it. setSpeechVoice selects that voice with Japanese language, rate 1 and pitch 1. An unselected, missing, non-Japanese voice or an empty voice list stays silent; the green flag alone never speaks. Stop cancels output and its queue. No speech recognition or microphone is used. Voices depend on the browser and OS. If the list is empty, check installed Japanese OS voices and reload the page. Assess the voice quality in your own environment.

See [samples/README.md](samples/README.md) for editable sources and regeneration.

## What it does

- Listens to the microphone and reports recognized text, once or continuously.
- Starts hats when speech is recognized and when someone starts speaking, so a project can stop speech output when the user interrupts.
- Speaks text with the browser's voices, with a choice of language, voice, rate, and pitch.
- Provides a Composition API so other extensions (such as a voice-chat extension) can use the same capability with their own blocks.

## Requirements and safety

- TurboWarp Web in a browser with the Web Speech API. Speech recognition works in Chrome, Edge, and Safari; Firefox does not provide it. Speech synthesis works in most browsers; available voices depend on the OS.
- TurboWarp Desktop: speech synthesis works, but speech recognition usually fails because Electron does not include the recognition service.

> [!IMPORTANT]
> This extension must run unsandboxed. Sandboxed extensions run in a worker, which has no speech APIs, and the extension starts hats through the VM runtime.
> Load extensions only from sources you trust.

- **Privacy:** Chrome and Edge normally send microphone audio to the browser vendor's cloud service for recognition. Explain this to users, especially in schools, before using speech recognition.
- The browser asks for microphone permission the first time listening starts.

## Installation

### Built JavaScript

1. Download [`dist/turbowarp-web-speech.js`](dist/turbowarp-web-speech.js?raw=1).
2. Open **Extensions** in TurboWarp.
3. Choose **Custom Extension** and load the file.
4. Enable **Run without sandbox**.

### npm package

```bash
pnpm add --save-exact @kubohiroya/turbowarp-web-speech@0.3.0
```

Standalone bundle:

```text
node_modules/@kubohiroya/turbowarp-web-speech/dist/turbowarp-web-speech.js
```

## Quick start

```text
when green flag clicked
set recognition language to [ja-JP]
set speech language to [ja-JP]
say (listen and wait)
speak (join [you said ] (recognized text)) and wait

when someone starts speaking
stop speaking
```

## Block reference

The block reference is generated from
[`src/block-definitions.json`](src/block-definitions.json). Do not edit the
generated section manually.

<!-- BEGIN GENERATED BLOCKS -->

### `speech recognition supported?`

Reports whether this browser offers speech recognition.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isRecognitionSupported` |

### `set recognition language to [LANG]`

Sets the language used from the next time listening starts.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setRecognitionLanguage` |
| `LANG` | String, default: `ja-JP`, choices: `ja-JP`, `en-US`, `en-GB`, `zh-CN`, `ko-KR`, `fr-FR`, `de-DE`, `es-ES` |

### `start listening [MODE]`

Starts listening. once stops after one utterance; continuous keeps listening until stop listening.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `startListening` |
| `MODE` | String, default: `once`, choices: `once`, `continuous` |

### `stop listening`

Stops listening and delivers any pending result.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `stopListening` |

### `listening?`

Reports whether the microphone is being listened to.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isListening` |

### `listen and wait`

Listens for one utterance and reports its text, or empty text when nothing was recognized.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `listenAndWait` |

### `when speech is recognized`

Starts each time an utterance is recognized.

| Property | Value |
|---|---|
| Type | Hat |
| Opcode | `whenSpeechRecognized` |

### `when someone starts speaking`

Starts when the recognizer detects the start of speech. Useful for stopping speech output when the user interrupts.

| Property | Value |
|---|---|
| Type | Hat |
| Opcode | `whenSpeechStarts` |

### `recognized text`

Reports the most recently recognized utterance.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `recognizedText` |

### `interim recognized text`

Reports the text recognized so far for the utterance in progress.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `interimText` |

### `speech synthesis supported?`

Reports whether this browser offers speech synthesis.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isSynthesisSupported` |

### `speak [TEXT]`

Starts speaking the text and continues the script immediately.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `speak` |
| `TEXT` | String, default: `こんにちは` |

### `speak [TEXT] and wait`

Speaks the text and waits until it ends or is stopped.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `speakAndWait` |
| `TEXT` | String, default: `こんにちは` |

### `stop speaking`

Stops speech output, including queued text.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `stopSpeaking` |

### `speaking?`

Reports whether speech output is in progress.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isSpeaking` |

### `set speech language to [LANG]`

Sets the language of speech output.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setSpeechLanguage` |
| `LANG` | String, default: `ja-JP`, choices: `ja-JP`, `en-US`, `en-GB`, `zh-CN`, `ko-KR`, `fr-FR`, `de-DE`, `es-ES` |

### `set speech voice to [VOICE]`

Chooses a voice by name. Available voices depend on the browser and OS; empty uses the default voice for the language.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setSpeechVoice` |
| `VOICE` | String, default: ``, choices: read from the browser at run time |

### `set speech rate to [RATE]`

Sets the speaking rate (0.1 to 10, normal 1).

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setSpeechRate` |
| `RATE` | Number, default: `1` |

### `set speech pitch to [PITCH]`

Sets the speaking pitch (0 to 2, normal 1).

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setSpeechPitch` |
| `PITCH` | Number, default: `1` |

### `available voices`

Reports the voices of this browser as JSON text.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `voicesJson` |

### `last speech error`

Reports the most recent recognition or synthesis error, or an empty string.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lastError` |

<!-- END GENERATED BLOCKS -->

## Important behavior

| Situation | Behavior |
|---|---|
| `start listening [once]` | Stops after one utterance. |
| `start listening [continuous]` | Keeps listening until `stop listening`. The browser ends sessions after silence; the extension restarts them automatically. |
| No speech detected | Reported in `last speech error`; continuous mode keeps listening. |
| Microphone denied, no microphone, or the service unreachable | Listening stops, even in continuous mode, and `last speech error` explains why. |
| `listen and wait` | Reports the first recognized utterance, or empty text when nothing was recognized. |
| `speak` while speaking | The new text is queued after the current one. |
| `stop speaking` | Stops the current and queued text; `speak and wait` then continues without an error. |
| Unknown voice name | The default voice for the speech language is used. |
| Project stop | Listening stops immediately (the microphone is released) and speech is silenced. |

## Composition API

Importing the Composition API does not register the standalone TurboWarp extension.

```ts
import {createWebSpeech} from '@kubohiroya/turbowarp-web-speech/composition';

const speech = createWebSpeech();
speech.setRecognitionLanguage('ja-JP');
speech.configureSpeech({lang: 'ja-JP', rate: 1.1});

speech.subscribe((event) => {
  if (event.type === 'speechStart') speech.cancelSpeech(); // barge-in
  if (event.type === 'final') console.log(event.text);
});

speech.startListening('continuous');
await speech.speak('こんにちは');

speech.release();
```

| Member | Purpose |
|---|---|
| `isRecognitionSupported` / `setRecognitionLanguage` / `startListening` / `stopListening` / `abortListening` / `listening` | Recognition control |
| `listenOnce()` | Resolve with one utterance, or `''` |
| `lastRecognizedText` / `interimText` / `lastConfidence` | Latest results |
| `isSynthesisSupported` / `configureSpeech` / `speechSettings` / `voices` / `speak` / `cancelSpeech` / `speaking` | Synthesis control; `speak` resolves when the utterance ends or is cancelled |
| `subscribe` | Events: `listening`, `speechStart`, `interim`, `final`, `error`, `speaking` |
| `release` | Stop listening and speaking, detach listeners |

Pass `environment` to `createWebSpeech` to substitute the browser APIs, for example in tests.

## Compatibility

| Identifier | Value | Stability |
|---|---|---|
| Product name | `TurboWarp-Web-Speech` | Human-facing |
| Repository | `kubohiroya/turbowarp-web-speech` | Current source location |
| npm package | `@kubohiroya/turbowarp-web-speech` | Public package contract |
| Extension ID | `kubohiroyawebspeech` | Stored in SB3; migration required to change |
| Composition API | `@kubohiroya/turbowarp-web-speech/composition` | Public package contract |

## Development

Use Node.js 24 or newer and the pnpm version declared by `packageManager`.

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

## License

[Mozilla Public License 2.0](LICENSE) (SPDX: `MPL-2.0`).

## Fixed input editing

With a compatible TurboWarp GUI, enable fixed-input forms to edit only standard literal fields. Numbers use complete finite JSON number tokens; menu fields use existing choices. Connected reporters and unavailable fields stay read-only and are never evaluated. Saving an unchanged form preserves exact existing raw values, including legacy spellings and unknown choices. Invalid drafts stay in the same editing session; cancel, project/target replacement, or block removal discards them. Disabling the GUI feature flag restores native field editing. This form does not run blocks, open network/audio/key/QR sessions, resolve names, or edit Schema arguments. Speech rate and pitch keep the existing runtime clamp behavior; the form does not narrow values to the clamp range.

Canonical contracts: `schemas/block-editor-fixed-inputs.schema.json`; codecs and optional registration: `src/fixed-input-editors.ts`. These contracts describe new fixed-field candidates; they do not redefine all runtime data. The GUI integration is optional and existing standalone/composition APIs stay available.

- `startListening`: MODE — [block documentation](https://kubohiroya.github.io/turbowarp-web-speech/#block-startListening).
- `setSpeechRate`: RATE — [block documentation](https://kubohiroya.github.io/turbowarp-web-speech/#block-setSpeechRate).
- `setSpeechPitch`: PITCH — [block documentation](https://kubohiroya.github.io/turbowarp-web-speech/#block-setSpeechPitch).
