import {extensionConfig} from './config';
import definitions from './block-definitions.json';
import {createWebSpeech, type ListenMode, type WebSpeech} from './composition.js';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN' | 'HAT';
type ArgumentTypeName = 'STRING' | 'NUMBER' | 'BOOLEAN';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
  menu?: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  arguments: Record<string, DefinitionArgument>;
}

interface MenuDefinition {
  acceptReporters: boolean;
  items: string[] | string;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];
const menuDefinitions = definitions.menus as Record<string, MenuDefinition>;

export const RECOGNIZED_OPCODE = `${extensionConfig.id}_whenSpeechRecognized`;
export const SPEECH_STARTS_OPCODE = `${extensionConfig.id}_whenSpeechStarts`;

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
export class WebSpeechExtension implements TurboWarpExtension {
  private lastErrorMessage = '';
  private readonly speech: WebSpeech;

  public constructor(deps: WebSpeechExtensionDependencies) {
    this.speech = deps.speech ?? createWebSpeech();
    this.speech.subscribe((event) => {
      if (event.type === 'final') deps.runtime.startHats(RECOGNIZED_OPCODE);
      else if (event.type === 'speechStart') deps.runtime.startHats(SPEECH_STARTS_OPCODE);
      else if (event.type === 'error') this.lastErrorMessage = event.message;
    });
    // The stop button should release the microphone and silence speech.
    deps.runtime.on('PROJECT_STOP_ALL', () => {
      this.speech.abortListening();
      this.speech.cancelSpeech();
    });
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block)),
      menus: Object.fromEntries(
        Object.entries(menuDefinitions).map(([id, menu]) => [
          id,
          {acceptReporters: menu.acceptReporters, items: Array.isArray(menu.items) ? [...menu.items] : menu.items}
        ])
      )
    };
  }

  /** Dynamic menu: the voices of this browser, with an empty entry for the default voice. */
  public voiceMenu(): Array<{text: string; value: string}> {
    return [
      {text: '(default)', value: ''},
      ...this.speech.voices().map((voice) => ({text: `${voice.name} (${voice.lang})`, value: voice.name}))
    ];
  }

  // ---- recognition --------------------------------------------------------------------------

  public isRecognitionSupported(): boolean {
    return this.speech.isRecognitionSupported();
  }

  public setRecognitionLanguage(args: Args): void {
    this.record(() => this.speech.setRecognitionLanguage(Scratch.Cast.toString(args.LANG)));
  }

  public startListening(args: Args): void {
    const mode: ListenMode = Scratch.Cast.toString(args.MODE) === 'continuous' ? 'continuous' : 'once';
    this.record(() => this.speech.startListening(mode));
  }

  public stopListening(): void {
    this.speech.stopListening();
  }

  public isListening(): boolean {
    return this.speech.listening;
  }

  public async listenAndWait(): Promise<string> {
    try {
      const text = await this.speech.listenOnce();
      this.lastErrorMessage = '';
      return text;
    } catch (error) {
      this.lastErrorMessage = messageOf(error);
      return '';
    }
  }

  public whenSpeechRecognized(): boolean {
    return true;
  }

  public whenSpeechStarts(): boolean {
    return true;
  }

  public recognizedText(): string {
    return this.speech.lastRecognizedText;
  }

  public interimText(): string {
    return this.speech.interimText;
  }

  // ---- synthesis ----------------------------------------------------------------------------

  public isSynthesisSupported(): boolean {
    return this.speech.isSynthesisSupported();
  }

  public speak(args: Args): void {
    this.speech.speak(Scratch.Cast.toString(args.TEXT)).catch((error: unknown) => {
      this.lastErrorMessage = messageOf(error);
    });
  }

  public async speakAndWait(args: Args): Promise<void> {
    try {
      await this.speech.speak(Scratch.Cast.toString(args.TEXT));
      this.lastErrorMessage = '';
    } catch (error) {
      this.lastErrorMessage = messageOf(error);
    }
  }

  public stopSpeaking(): void {
    this.speech.cancelSpeech();
  }

  public isSpeaking(): boolean {
    return this.speech.speaking;
  }

  public setSpeechLanguage(args: Args): void {
    this.record(() => this.speech.configureSpeech({lang: Scratch.Cast.toString(args.LANG)}));
  }

  public setSpeechVoice(args: Args): void {
    this.record(() => this.speech.configureSpeech({voice: Scratch.Cast.toString(args.VOICE)}));
  }

  public setSpeechRate(args: Args): void {
    this.record(() => this.speech.configureSpeech({rate: Scratch.Cast.toNumber(args.RATE)}));
  }

  public setSpeechPitch(args: Args): void {
    this.record(() => this.speech.configureSpeech({pitch: Scratch.Cast.toNumber(args.PITCH)}));
  }

  public voicesJson(): string {
    return JSON.stringify(this.speech.voices());
  }

  public lastError(): string {
    return this.lastErrorMessage;
  }

  // ---- internals ----------------------------------------------------------------------------

  private record(action: () => void): void {
    try {
      action();
      this.lastErrorMessage = '';
    } catch (error) {
      this.lastErrorMessage = messageOf(error);
    }
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    const scratchBlock: Record<string, unknown> = {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: Scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue,
            ...(argument.menu ? {menu: argument.menu} : {})
          }
        ])
      )
    };
    if (block.blockType === 'HAT') scratchBlock.isEdgeActivated = false;
    return scratchBlock;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
