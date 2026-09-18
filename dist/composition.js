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
export { browserEnvironment, createWebSpeech };
