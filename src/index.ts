import {extensionConfig} from './config.js';
import {WebSpeechExtension, type HatRuntime} from './extension.js';

if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) {
  throw new Error(`${extensionConfig.name} must run unsandboxed.`);
}

const runtime = Scratch.vm?.runtime as HatRuntime | undefined;
if (!runtime) {
  throw new Error(`${extensionConfig.name} requires access to the TurboWarp VM runtime.`);
}

Scratch.extensions.register(new WebSpeechExtension({runtime}));
