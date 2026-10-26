// Name: TurboWarp-Web-Speech
// ID: kubohiroyawebspeech
// Description: Speech recognition and speech synthesis in the browser with the Web Speech API.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

//#region src/config.ts
var extensionConfig = {
	id: "kubohiroyawebspeech",
	slug: "turbowarp-web-speech",
	name: "TurboWarp-Web-Speech",
	description: "Speech recognition and speech synthesis in the browser with the Web Speech API.",
	author: "Hiroya Kubo",
	license: "MPL-2.0",
	unsandboxed: true,
	docsURI: "https://kubohiroya.github.io/turbowarp-web-speech/",
	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iMTgiIHk9IjYiIHdpZHRoPSIxMiIgaGVpZ2h0PSIyMiIgcng9IjYiIGZpbGw9IiNFNjUzM0MiLz48cGF0aCBkPSJNMTIgMjJhMTIgMTIgMCAwIDAgMjQgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTY1MzNDIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNCAzNHY3TTE3IDQxaDE0IiBzdHJva2U9IiNFNjUzM0MiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTM4IDE0YzIgMi41IDIgNy41IDAgMTBNNDIgMTFjMy41IDQgMy41IDEyIDAgMTYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0YyOUMzOCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=="
};
var block_editor_fixed_inputs_schema_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$id: "https://kubohiroya.github.io/turbowarp-web-speech/schemas/block-editor-fixed-inputs.schema.json",
	title: "turbowarp-web-speech fixed editing contracts",
	$defs: {
		"startListening": {
			"type": "object",
			"properties": { "MODE": {
				"type": "string",
				"enum": ["once", "continuous"]
			} },
			"additionalProperties": false
		},
		"setSpeechRate": {
			"type": "object",
			"properties": { "RATE": { "type": "number" } },
			"additionalProperties": false
		},
		"setSpeechPitch": {
			"type": "object",
			"properties": { "PITCH": { "type": "number" } },
			"additionalProperties": false
		}
	}
};
//#endregion
//#region src/fixed-input-editors.ts
var contracts = block_editor_fixed_inputs_schema_default.$defs;
var repository = "turbowarp-web-speech";
var extensionId = "kubohiroyawebspeech";
var token = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u;
function readNumber(value) {
	if (typeof value !== "string" && typeof value !== "number") throw new TypeError("Invalid numeric projection.");
	if (typeof value === "string" && value.trim() === "") throw new TypeError("Existing blank field is readonly.");
	const number = Number(value);
	if (!Number.isFinite(number)) throw new TypeError("Existing nonfinite field is readonly.");
	return number;
}
function newNumberToken(value) {
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("Invalid new number.");
		return Object.is(value, -0) ? "-0" : String(value);
	}
	if (typeof value !== "string" || !token.test(value.trim()) || !Number.isFinite(Number(value))) throw new TypeError("Invalid new number.");
	return value.trim();
}
function existingChoice(_opcode, value) {
	if (typeof value !== "string") throw new TypeError("Invalid string projection.");
	return value;
}
function candidateValid(_opcode, _argument, schema, value) {
	if (schema.type === "number" || schema.type === "integer") {
		let number;
		try {
			number = readNumber(value);
		} catch {
			return false;
		}
		if (schema.type === "integer" && !Number.isInteger(number)) return false;
		if (schema.minimum !== void 0 && number < schema.minimum) return false;
		if (schema.maximum !== void 0 && number > schema.maximum) return false;
		if (schema.exclusiveMinimum !== void 0 && number <= schema.exclusiveMinimum) return false;
		if (schema.enum && !schema.enum.includes(number)) return false;
		return true;
	}
	return typeof value === "string" && schema.enum.includes(value);
}
function fixedInputEditorOptions() {
	return Object.entries(contracts).map(([opcode, contract]) => ({
		apiVersion: 1,
		extensionId,
		editorId: `${extensionId}.fixed.${opcode}`,
		opcodes: [`${extensionId}_${opcode}`],
		contractId: `${repository}.${opcode}.fixed`,
		contractRevision: "fixed-inputs-v1",
		validationContext: () => ({
			consumerId: repository,
			nowMs: 0,
			settings: null
		}),
		bindings: Object.entries(contract.properties).map(([argument, schema]) => {
			const numeric = schema.type === "number" || schema.type === "integer";
			const source = {
				repository,
				path: "schemas/block-editor-fixed-inputs.schema.json",
				symbol: `/$defs/${opcode}/properties/${argument}`
			};
			return {
				argument,
				schemaBundle: {
					identity: {
						ownerId: repository,
						contractId: `${opcode}.${argument}`,
						revision: "fixed-inputs-v1",
						variantId: "fixed"
					},
					dialect: "draft-07",
					root: {
						retrievalUri: `${block_editor_fixed_inputs_schema_default.$id}?binding=${opcode}.${argument}`,
						document: schema,
						artifact: {
							role: "canonical-schema",
							source
						}
					},
					resources: [],
					provenance: {
						canonicalSources: [
							source,
							{
								repository,
								path: "src/block-definitions.json"
							},
							{
								repository,
								path: "src/extension.ts",
								symbol: opcode
							}
						],
						generatedFiles: [],
						referenceSchemas: [],
						generationSources: []
					}
				},
				control: numeric ? { kind: "number" } : {
					kind: "enum",
					choices: schema.enum.map((value) => ({
						value,
						label: String(value)
					}))
				},
				read: (value) => numeric ? readNumber(value) : existingChoice(opcode, value),
				encode: (value) => {
					if (numeric) return newNumberToken(value);
					if (typeof value !== "string" || !schema.enum.includes(value)) throw new TypeError("Invalid new enum value.");
					return value;
				},
				validateCandidate: (value) => candidateValid(opcode, argument, schema, value) ? [] : [{
					path: argument,
					message: "Check this value before saving."
				}]
			};
		})
	}));
}
/** Register only visible static contracts; ordinary composition consumers load no editor runtime. */
function registerFixedInputEditors(scratch, runtime, visibleBlocks) {
	const api = scratch.gui?.blockEditors;
	if (api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== "function") return void 0;
	const visibleOpcodes = new Set(visibleBlocks.flatMap((block) => {
		if (typeof block !== "object" || block === null || !("opcode" in block)) return [];
		return typeof block.opcode === "string" ? [block.opcode] : [];
	}));
	const events = runtime;
	const removers = [];
	let active = true;
	const dispose = () => {
		if (!active) return;
		active = false;
		events?.off?.("RUNTIME_DISPOSED", dispose);
		for (const remove of removers.splice(0).reverse()) remove();
	};
	try {
		for (const options of fixedInputEditorOptions()) if (options.opcodes.some((opcode) => visibleOpcodes.has(opcode.slice(20)))) removers.push(api.registerFixedInputEditor.call(api, options));
		events?.on?.("RUNTIME_DISPOSED", dispose);
	} catch (error) {
		dispose();
		throw error;
	}
	return dispose;
}
var block_definitions_default = {
	extensionName: "Web Speech",
	blocks: [
		{
			"opcode": "isRecognitionSupported",
			"blockType": "BOOLEAN",
			"text": "speech recognition supported?",
			"description": "Reports whether this browser offers speech recognition.",
			"descriptionJa": "このブラウザで音声認識が使えるかを返します。",
			"arguments": {}
		},
		{
			"opcode": "setRecognitionLanguage",
			"blockType": "COMMAND",
			"text": "set recognition language to [LANG]",
			"description": "Sets the language used from the next time listening starts.",
			"descriptionJa": "次に聞き取りを始めるときから使う言語を設定します。",
			"arguments": { "LANG": {
				"type": "STRING",
				"defaultValue": "ja-JP",
				"menu": "languages"
			} }
		},
		{
			"opcode": "startListening",
			"blockType": "COMMAND",
			"text": "start listening [MODE]",
			"description": "Starts listening. once stops after one utterance; continuous keeps listening until stop listening.",
			"descriptionJa": "聞き取りを始めます。onceは1回話すと止まり、continuousはstop listeningまで聞き続けます。",
			"arguments": { "MODE": {
				"type": "STRING",
				"defaultValue": "once",
				"menu": "listenModes"
			} }
		},
		{
			"opcode": "stopListening",
			"blockType": "COMMAND",
			"text": "stop listening",
			"description": "Stops listening and delivers any pending result.",
			"descriptionJa": "聞き取りを止めます。認識途中の結果があれば確定させます。",
			"arguments": {}
		},
		{
			"opcode": "isListening",
			"blockType": "BOOLEAN",
			"text": "listening?",
			"description": "Reports whether the microphone is being listened to.",
			"descriptionJa": "聞き取り中かを返します。",
			"arguments": {}
		},
		{
			"opcode": "listenAndWait",
			"blockType": "REPORTER",
			"text": "listen and wait",
			"description": "Listens for one utterance and reports its text, or empty text when nothing was recognized.",
			"descriptionJa": "1回分の発話を聞き取り、その文字列を返します。認識できなければ空文字列を返します。",
			"arguments": {}
		},
		{
			"opcode": "whenSpeechRecognized",
			"blockType": "HAT",
			"text": "when speech is recognized",
			"description": "Starts each time an utterance is recognized.",
			"descriptionJa": "発話が認識されるたびに起動します。",
			"arguments": {}
		},
		{
			"opcode": "whenSpeechStarts",
			"blockType": "HAT",
			"text": "when someone starts speaking",
			"description": "Starts when the recognizer detects the start of speech. Useful for stopping speech output when the user interrupts.",
			"descriptionJa": "話し始めを検出したときに起動します。利用者が割り込んだときに読み上げを止めるのに使えます。",
			"arguments": {}
		},
		{
			"opcode": "recognizedText",
			"blockType": "REPORTER",
			"text": "recognized text",
			"description": "Reports the most recently recognized utterance.",
			"descriptionJa": "直近に認識された発話を返します。",
			"arguments": {}
		},
		{
			"opcode": "interimText",
			"blockType": "REPORTER",
			"text": "interim recognized text",
			"description": "Reports the text recognized so far for the utterance in progress.",
			"descriptionJa": "話している途中の発話について、ここまでに認識された文字列を返します。",
			"arguments": {}
		},
		{
			"opcode": "isSynthesisSupported",
			"blockType": "BOOLEAN",
			"text": "speech synthesis supported?",
			"description": "Reports whether this browser offers speech synthesis.",
			"descriptionJa": "このブラウザで音声合成が使えるかを返します。",
			"arguments": {}
		},
		{
			"opcode": "speak",
			"blockType": "COMMAND",
			"text": "speak [TEXT]",
			"description": "Starts speaking the text and continues the script immediately.",
			"descriptionJa": "文字列の読み上げを始め、終わるのを待たずに次のブロックへ進みます。",
			"arguments": { "TEXT": {
				"type": "STRING",
				"defaultValue": "こんにちは"
			} }
		},
		{
			"opcode": "speakAndWait",
			"blockType": "COMMAND",
			"text": "speak [TEXT] and wait",
			"description": "Speaks the text and waits until it ends or is stopped.",
			"descriptionJa": "文字列を読み上げ、終わるか止められるまで待ちます。",
			"arguments": { "TEXT": {
				"type": "STRING",
				"defaultValue": "こんにちは"
			} }
		},
		{
			"opcode": "stopSpeaking",
			"blockType": "COMMAND",
			"text": "stop speaking",
			"description": "Stops speech output, including queued text.",
			"descriptionJa": "待ち行列にある分も含めて、読み上げを止めます。",
			"arguments": {}
		},
		{
			"opcode": "isSpeaking",
			"blockType": "BOOLEAN",
			"text": "speaking?",
			"description": "Reports whether speech output is in progress.",
			"descriptionJa": "読み上げ中かを返します。",
			"arguments": {}
		},
		{
			"opcode": "setSpeechLanguage",
			"blockType": "COMMAND",
			"text": "set speech language to [LANG]",
			"description": "Sets the language of speech output.",
			"descriptionJa": "読み上げの言語を設定します。",
			"arguments": { "LANG": {
				"type": "STRING",
				"defaultValue": "ja-JP",
				"menu": "languages"
			} }
		},
		{
			"opcode": "setSpeechVoice",
			"blockType": "COMMAND",
			"text": "set speech voice to [VOICE]",
			"description": "Chooses a voice by name. Available voices depend on the browser and OS; empty uses the default voice for the language.",
			"descriptionJa": "名前で声を選びます。使える声はブラウザとOSによって異なります。空にすると、その言語の既定の声を使います。",
			"arguments": { "VOICE": {
				"type": "STRING",
				"defaultValue": "",
				"menu": "voices"
			} }
		},
		{
			"opcode": "setSpeechRate",
			"blockType": "COMMAND",
			"text": "set speech rate to [RATE]",
			"description": "Sets the speaking rate (0.1 to 10, normal 1).",
			"descriptionJa": "読み上げの速さを設定します（0.1〜10、標準は1）。",
			"arguments": { "RATE": {
				"type": "NUMBER",
				"defaultValue": "1"
			} }
		},
		{
			"opcode": "setSpeechPitch",
			"blockType": "COMMAND",
			"text": "set speech pitch to [PITCH]",
			"description": "Sets the speaking pitch (0 to 2, normal 1).",
			"descriptionJa": "読み上げの声の高さを設定します（0〜2、標準は1）。",
			"arguments": { "PITCH": {
				"type": "NUMBER",
				"defaultValue": "1"
			} }
		},
		{
			"opcode": "voicesJson",
			"blockType": "REPORTER",
			"text": "available voices",
			"description": "Reports the voices of this browser as JSON text.",
			"descriptionJa": "このブラウザで使える声の一覧をJSONテキストで返します。",
			"arguments": {}
		},
		{
			"opcode": "lastError",
			"blockType": "REPORTER",
			"text": "last speech error",
			"description": "Reports the most recent recognition or synthesis error, or an empty string.",
			"descriptionJa": "直近の音声認識または音声合成のエラーを返します。エラーがなければ空文字列を返します。",
			"arguments": {}
		}
	],
	menus: {
		"languages": {
			"acceptReporters": true,
			"items": [
				"ja-JP",
				"en-US",
				"en-GB",
				"zh-CN",
				"ko-KR",
				"fr-FR",
				"de-DE",
				"es-ES"
			]
		},
		"listenModes": {
			"acceptReporters": false,
			"items": ["once", "continuous"]
		},
		"voices": {
			"acceptReporters": true,
			"items": "voiceMenu"
		}
	}
};
//#endregion
//#region src/recognition.ts
/** Errors after which restarting in continuous mode would only loop. */
var FATAL_ERRORS = /* @__PURE__ */ new Set([
	"not-allowed",
	"service-not-allowed",
	"audio-capture",
	"network",
	"language-not-supported"
]);
/**
* Wraps SpeechRecognition. In continuous mode the browser still ends the session after silence, so
* the controller restarts it until `stop()` is called or a fatal error occurs.
*/
var RecognitionController = class {
	constructor(environment, emit) {
		this.environment = environment;
		this.emit = emit;
		this.recognition = null;
		this.wanted = false;
		this.active = false;
		this.options = {
			lang: "ja-JP",
			mode: "once",
			interimResults: true
		};
	}
	isSupported() {
		return this.environment.createRecognition() !== null;
	}
	get listening() {
		return this.active;
	}
	start(options) {
		this.stop();
		const recognition = this.environment.createRecognition();
		if (!recognition) throw new Error("Speech recognition is not supported in this browser.");
		this.options = options;
		this.recognition = recognition;
		this.wanted = true;
		recognition.lang = options.lang;
		recognition.continuous = options.mode === "continuous";
		recognition.interimResults = options.interimResults;
		recognition.maxAlternatives = 1;
		recognition.onstart = () => this.setActive(recognition, true);
		recognition.onspeechstart = () => {
			if (this.recognition === recognition) this.emit({ type: "speechStart" });
		};
		recognition.onresult = (event) => {
			if (this.recognition === recognition) this.handleResult(event);
		};
		recognition.onerror = (event) => {
			if (this.recognition !== recognition) return;
			if (FATAL_ERRORS.has(event.error)) this.wanted = false;
			this.emit({
				type: "error",
				error: event.error,
				message: describeError(event.error, event.message)
			});
		};
		recognition.onend = () => {
			if (this.recognition !== recognition) return;
			if (this.wanted && this.options.mode === "continuous") try {
				recognition.start();
				return;
			} catch {}
			this.wanted = false;
			this.setActive(recognition, false);
			this.recognition = null;
		};
		recognition.start();
	}
	/** Stops listening and delivers any pending final result. */
	stop() {
		const recognition = this.recognition;
		this.wanted = false;
		if (recognition) recognition.stop();
	}
	/** Stops listening immediately and discards pending results. */
	abort() {
		const recognition = this.recognition;
		this.wanted = false;
		this.recognition = null;
		if (recognition) {
			recognition.abort();
			this.setActive(recognition, false, true);
		}
	}
	handleResult(event) {
		let interim = "";
		for (let index = event.resultIndex; index < event.results.length; index += 1) {
			const result = event.results[index];
			const best = result?.[0];
			if (!result || !best) continue;
			if (result.isFinal) this.emit({
				type: "final",
				text: best.transcript.trim(),
				confidence: best.confidence
			});
			else interim += best.transcript;
		}
		if (interim.length > 0) this.emit({
			type: "interim",
			text: interim.trim()
		});
	}
	setActive(recognition, active, force = false) {
		if (!force && this.recognition !== recognition) return;
		if (this.active === active) return;
		this.active = active;
		this.emit({
			type: "listening",
			listening: active
		});
	}
};
function describeError(error, message) {
	return {
		"not-allowed": "Microphone access was denied.",
		"service-not-allowed": "Speech recognition is not allowed in this browser (it may not work in TurboWarp Desktop).",
		"audio-capture": "No microphone was found.",
		network: "The speech recognition service could not be reached.",
		"no-speech": "No speech was detected.",
		aborted: "Listening was aborted.",
		"language-not-supported": "This recognition language is not supported."
	}[error] ?? (message && message.length > 0 ? message : `Speech recognition error: ${error}`);
}
//#endregion
//#region src/speech-types.ts
/** The real browser environment. Chrome and Safari expose recognition as webkitSpeechRecognition. */
function browserEnvironment() {
	const scope = globalThis;
	const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
	const Utterance = scope.SpeechSynthesisUtterance;
	return {
		createRecognition: () => Recognition ? new Recognition() : null,
		synthesis: scope.speechSynthesis && Utterance ? scope.speechSynthesis : null,
		createUtterance: (text) => {
			if (!Utterance) throw new Error("Speech synthesis is not supported in this browser.");
			return new Utterance(text);
		}
	};
}
//#endregion
//#region src/synthesis.ts
function defaultSpeechSettings() {
	return {
		lang: "ja-JP",
		voice: "",
		rate: 1,
		pitch: 1,
		volume: 1
	};
}
/** Wraps speechSynthesis. `speak` resolves when the utterance ends or is cancelled. */
var SynthesisController = class {
	constructor(environment, voiceWaitMs = 1e3) {
		this.environment = environment;
		this.voiceWaitMs = voiceWaitMs;
		this.settings = defaultSpeechSettings();
		this.pending = 0;
	}
	isSupported() {
		return this.environment.synthesis !== null;
	}
	get speaking() {
		return this.pending > 0 || (this.environment.synthesis?.speaking ?? false);
	}
	get currentSettings() {
		return { ...this.settings };
	}
	configure(settings) {
		const next = {
			...this.settings,
			...settings
		};
		next.rate = clamp(next.rate, .1, 10, "Speech rate");
		next.pitch = clamp(next.pitch, 0, 2, "Speech pitch");
		next.volume = clamp(next.volume, 0, 1, "Speech volume");
		this.settings = next;
	}
	/** Voices of this browser; those matching the speech language come first. */
	voices() {
		const primary = this.settings.lang.split("-")[0]?.toLowerCase() ?? "";
		const matches = (voice) => voice.lang.toLowerCase().startsWith(primary) ? 0 : 1;
		return [...this.environment.synthesis?.getVoices() ?? []].sort((left, right) => matches(left) - matches(right)).map((voice) => ({
			name: voice.name,
			lang: voice.lang,
			default: voice.default,
			localService: voice.localService
		}));
	}
	speak(text) {
		const synthesis = this.environment.synthesis;
		if (!synthesis) return Promise.reject(/* @__PURE__ */ new Error("Speech synthesis is not supported in this browser."));
		if (text.trim().length === 0) return Promise.resolve();
		if (this.settings.voice.trim().length > 0 && synthesis.getVoices().length === 0) return this.voicesReady(this.voiceWaitMs).then(() => this.utter(text));
		return this.utter(text);
	}
	utter(text) {
		const synthesis = this.environment.synthesis;
		if (!synthesis) return Promise.reject(/* @__PURE__ */ new Error("Speech synthesis is not supported in this browser."));
		const utterance = this.environment.createUtterance(text);
		utterance.lang = this.settings.lang;
		utterance.voice = this.findVoice(synthesis.getVoices());
		utterance.rate = this.settings.rate;
		utterance.pitch = this.settings.pitch;
		utterance.volume = this.settings.volume;
		this.pending += 1;
		return new Promise((resolve, reject) => {
			const finish = (error) => {
				this.pending = Math.max(0, this.pending - 1);
				if (error) reject(error);
				else resolve();
			};
			utterance.onend = () => finish();
			utterance.onerror = (event) => {
				if (event.error === "canceled" || event.error === "interrupted") finish();
				else finish(/* @__PURE__ */ new Error(`Speech synthesis error: ${event.error}`));
			};
			synthesis.speak(utterance);
		});
	}
	cancel() {
		this.environment.synthesis?.cancel();
	}
	/** Resolves when the voice list is available, or after `timeoutMs`. */
	voicesReady(timeoutMs) {
		const synthesis = this.environment.synthesis;
		if (!synthesis || synthesis.getVoices().length > 0 || !synthesis.addEventListener) return Promise.resolve();
		return new Promise((resolve) => {
			const timer = setTimeout(resolve, timeoutMs);
			synthesis.addEventListener?.("voiceschanged", () => {
				clearTimeout(timer);
				resolve();
			});
		});
	}
	findVoice(voices) {
		const name = this.settings.voice.trim();
		if (name.length === 0) return null;
		return voices.find((voice) => voice.name === name) ?? null;
	}
};
function clamp(value, min, max, label) {
	if (!Number.isFinite(value)) throw new TypeError(`${label} must be a number.`);
	return Math.min(max, Math.max(min, value));
}
//#endregion
//#region src/composition.ts
/**
* Composition API: browser speech recognition and synthesis without TurboWarp block definitions.
*
* Importing this module does not register a TurboWarp extension and does not touch the `Scratch`
* global. Everything runs in the browser; no API key or server of this package is involved.
*/
function createWebSpeech(options = {}) {
	return new WebSpeechImpl(options.environment ?? browserEnvironment());
}
var LANG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/u;
var WebSpeechImpl = class {
	constructor(environment) {
		this.listeners = /* @__PURE__ */ new Set();
		this.lang = "ja-JP";
		this.lastText = "";
		this.interim = "";
		this.confidence = 0;
		this.error = "";
		this.recognition = new RecognitionController(environment, (event) => this.onRecognition(event));
		this.synthesis = new SynthesisController(environment);
	}
	isRecognitionSupported() {
		return this.recognition.isSupported();
	}
	setRecognitionLanguage(lang) {
		this.lang = normalizeLang(lang);
	}
	get recognitionLanguage() {
		return this.lang;
	}
	startListening(mode) {
		this.recognition.start({
			lang: this.lang,
			mode,
			interimResults: true
		});
	}
	stopListening() {
		this.recognition.stop();
	}
	abortListening() {
		this.recognition.abort();
	}
	get listening() {
		return this.recognition.listening;
	}
	listenOnce() {
		return new Promise((resolve, reject) => {
			let result = null;
			const unsubscribe = this.subscribe((event) => {
				if (event.type === "final" && result === null) result = event.text;
				if (event.type === "listening" && !event.listening) {
					unsubscribe();
					resolve(result ?? "");
				}
			});
			try {
				this.startListening("once");
			} catch (error) {
				unsubscribe();
				reject(error);
			}
		});
	}
	get lastRecognizedText() {
		return this.lastText;
	}
	get interimText() {
		return this.interim;
	}
	get lastConfidence() {
		return this.confidence;
	}
	isSynthesisSupported() {
		return this.synthesis.isSupported();
	}
	configureSpeech(settings) {
		const next = { ...settings };
		if (next.lang !== void 0) next.lang = normalizeLang(next.lang);
		this.synthesis.configure(next);
	}
	get speechSettings() {
		return this.synthesis.currentSettings;
	}
	voices() {
		return this.synthesis.voices();
	}
	async speak(text) {
		this.emit({
			type: "speaking",
			speaking: true
		});
		try {
			await this.synthesis.speak(text);
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
			throw error;
		} finally {
			if (!this.synthesis.speaking) this.emit({
				type: "speaking",
				speaking: false
			});
		}
	}
	cancelSpeech() {
		this.synthesis.cancel();
	}
	get speaking() {
		return this.synthesis.speaking;
	}
	get lastError() {
		return this.error;
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	release() {
		this.recognition.abort();
		this.synthesis.cancel();
		this.listeners.clear();
	}
	onRecognition(event) {
		if (event.type === "final") {
			this.lastText = event.text;
			this.confidence = event.confidence;
			this.interim = "";
		} else if (event.type === "interim") this.interim = event.text;
		else if (event.type === "error") this.error = event.message;
		this.emit(event);
	}
	emit(event) {
		for (const listener of [...this.listeners]) listener(event);
	}
};
function normalizeLang(value) {
	const lang = value.trim();
	if (!LANG_PATTERN.test(lang)) throw new TypeError("Language must be a tag such as ja-JP or en-US.");
	return lang;
}
//#endregion
//#region src/extension.ts
var blockDefinitions = block_definitions_default.blocks;
var menuDefinitions = block_definitions_default.menus;
var RECOGNIZED_OPCODE = `${extensionConfig.id}_whenSpeechRecognized`;
var SPEECH_STARTS_OPCODE = `${extensionConfig.id}_whenSpeechStarts`;
/** Block surface over the Web Speech composition. */
var WebSpeechExtension = class {
	constructor(deps) {
		this.lastErrorMessage = "";
		this.fixedEditorRuntime = deps.runtime;
		this.speech = deps.speech ?? createWebSpeech();
		this.speech.subscribe((event) => {
			if (event.type === "final") deps.runtime.startHats(RECOGNIZED_OPCODE);
			else if (event.type === "speechStart") deps.runtime.startHats(SPEECH_STARTS_OPCODE);
			else if (event.type === "error") this.lastErrorMessage = event.message;
		});
		deps.runtime.on("PROJECT_STOP_ALL", () => {
			this.speech.abortListening();
			this.speech.cancelSpeech();
		});
	}
	getInfo() {
		const info = {
			id: extensionConfig.id,
			name: Scratch.translate(block_definitions_default.extensionName),
			docsURI: extensionConfig.docsURI,
			blockIconURI: extensionConfig.blockIconURI,
			blocks: blockDefinitions.map((block) => this.toScratchBlock(block)),
			menus: Object.fromEntries(Object.entries(menuDefinitions).map(([id, menu]) => [id, {
				acceptReporters: menu.acceptReporters,
				items: Array.isArray(menu.items) ? [...menu.items] : menu.items
			}]))
		};
		this.fixedEditorsDispose ?? (this.fixedEditorsDispose = registerFixedInputEditors(Scratch, this.fixedEditorRuntime, info.blocks));
		return info;
	}
	/** Dynamic menu: the voices of this browser, with an empty entry for the default voice. */
	voiceMenu() {
		return [{
			text: "(default)",
			value: ""
		}, ...this.speech.voices().map((voice) => ({
			text: `${voice.name} (${voice.lang})`,
			value: voice.name
		}))];
	}
	isRecognitionSupported() {
		return this.speech.isRecognitionSupported();
	}
	setRecognitionLanguage(args) {
		this.record(() => this.speech.setRecognitionLanguage(Scratch.Cast.toString(args.LANG)));
	}
	startListening(args) {
		const mode = Scratch.Cast.toString(args.MODE) === "continuous" ? "continuous" : "once";
		this.record(() => this.speech.startListening(mode));
	}
	stopListening() {
		this.speech.stopListening();
	}
	isListening() {
		return this.speech.listening;
	}
	async listenAndWait() {
		try {
			const text = await this.speech.listenOnce();
			this.lastErrorMessage = "";
			return text;
		} catch (error) {
			this.lastErrorMessage = messageOf(error);
			return "";
		}
	}
	whenSpeechRecognized() {
		return true;
	}
	whenSpeechStarts() {
		return true;
	}
	recognizedText() {
		return this.speech.lastRecognizedText;
	}
	interimText() {
		return this.speech.interimText;
	}
	isSynthesisSupported() {
		return this.speech.isSynthesisSupported();
	}
	speak(args) {
		this.speech.speak(Scratch.Cast.toString(args.TEXT)).catch((error) => {
			this.lastErrorMessage = messageOf(error);
		});
	}
	async speakAndWait(args) {
		try {
			await this.speech.speak(Scratch.Cast.toString(args.TEXT));
			this.lastErrorMessage = "";
		} catch (error) {
			this.lastErrorMessage = messageOf(error);
		}
	}
	stopSpeaking() {
		this.speech.cancelSpeech();
	}
	isSpeaking() {
		return this.speech.speaking;
	}
	setSpeechLanguage(args) {
		this.record(() => this.speech.configureSpeech({ lang: Scratch.Cast.toString(args.LANG) }));
	}
	setSpeechVoice(args) {
		this.record(() => this.speech.configureSpeech({ voice: Scratch.Cast.toString(args.VOICE) }));
	}
	setSpeechRate(args) {
		this.record(() => this.speech.configureSpeech({ rate: Scratch.Cast.toNumber(args.RATE) }));
	}
	setSpeechPitch(args) {
		this.record(() => this.speech.configureSpeech({ pitch: Scratch.Cast.toNumber(args.PITCH) }));
	}
	voicesJson() {
		return JSON.stringify(this.speech.voices());
	}
	lastError() {
		return this.lastErrorMessage;
	}
	record(action) {
		try {
			action();
			this.lastErrorMessage = "";
		} catch (error) {
			this.lastErrorMessage = messageOf(error);
		}
	}
	toScratchBlock(block) {
		const scratchBlock = {
			opcode: block.opcode,
			blockType: Scratch.BlockType[block.blockType],
			text: Scratch.translate(block.text),
			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
				type: Scratch.ArgumentType[argument.type],
				defaultValue: argument.defaultValue,
				...argument.menu ? { menu: argument.menu } : {}
			}]))
		};
		if (block.blockType === "HAT") scratchBlock.isEdgeActivated = false;
		return scratchBlock;
	}
};
function messageOf(error) {
	return error instanceof Error ? error.message : String(error);
}
//#endregion
//#region src/index.ts
if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
var runtime = Scratch.vm?.runtime;
if (!runtime) throw new Error(`${extensionConfig.name} requires access to the TurboWarp VM runtime.`);
Scratch.extensions.register(new WebSpeechExtension({ runtime }));
//#endregion

})(Scratch);
