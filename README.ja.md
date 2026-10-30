# TurboWarp-Web-Speech

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

Web Speech APIを使い、ブラウザの中で音声認識と音声合成を行うTurboWarp機能拡張です。APIキーも、この拡張専用のサーバも不要です。

**利用ガイド:** [English](https://kubohiroya.github.io/turbowarp-web-speech/)

## 最小デモ

[TurboWarp Editorで開く](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-web-speech%2Fsamples%2Fspeak-one-sentence.sb3) · [SB3ダウンロード](https://kubohiroya.github.io/turbowarp-web-speech/samples/speak-one-sentence.sb3)

初期選択は日本語音声のKyokoです。Kyokoが利用できない環境では発話しません。ステージのコードにある「Voice name を（音声メニュー）にする」のドロップダウンで、一覧に表示された日本語（ja / ja-JP）の声を選び、緑の旗で設定を反映します。「Japanese voice found」がtrueになったら、聞きたいときに青いSpeakスプライトをクリックします。setSpeechVoiceで指定した声を使い、日本語・速度1・高さ1で短文を読み上げます。未選択・声の一覧が空・選んだ日本語音声が現在の一覧にない場合は発話しません。緑の旗だけでは発話しません。停止ボタンで出力と待ち行列を取り消します。音声認識やマイクは使いません。音声はブラウザ/OSの導入状況で異なり、一覧が空ならOSの日本語音声設定を確認してページを再読込してください。声質・聞こえ方は利用者の環境で確認してください。

編集元と再生成方法は[samples/README.md](samples/README.md)を参照。

## できること

- マイクの音声を聞き取り、認識した文字列を返す（1回だけ、または連続）
- 発話が認識されたとき、また話し始めたときにハットを起動する（利用者が割り込んだら読み上げを止める、といった処理に使える）
- ブラウザの声で文字列を読み上げる（言語、声、速さ、高さを選べる）
- 音声会話の拡張など、ほかの拡張が自分のブロックと組み合わせて同じ機能を使えるよう、Composition APIを提供する

## 動作条件と安全上の注意

- Web Speech APIに対応したブラウザで動くTurboWarp Web。音声認識はChrome、Edge、Safariで使えますが、Firefoxにはありません。音声合成はほとんどのブラウザで使えます。使える声はOSによって違います。
- TurboWarp Desktop：音声合成は使えますが、音声認識は通常失敗します。Electronには認識のサービスが含まれていないためです。

> [!IMPORTANT]
> この機能拡張は、サンドボックスなしで実行する必要があります。サンドボックス内の拡張はworkerで動き、音声のAPIが使えないためです。また、VMランタイムを通じてハットを起動します。
> 信頼できる配布元の機能拡張だけを読み込んでください。

- **プライバシー：** ChromeとEdgeは通常、音声認識のためにマイクの音声をブラウザ提供元のクラウドサービスに送ります。音声認識を使う前に、特に学校などではこの点を利用者に説明してください。
- 初めて聞き取りを始めるとき、ブラウザがマイクの使用許可を求めます。

## インストール

1. [`dist/turbowarp-web-speech.js`](dist/turbowarp-web-speech.js?raw=1)をダウンロードします。
2. TurboWarpで**機能拡張**を開きます。
3. **カスタム機能拡張**からfileを読み込みます。
4. **サンドボックスなしで実行する**を有効にします。

npm packageとして使う場合は、検証済みのversionをexact pinします。

```bash
pnpm add --save-exact @kubohiroya/turbowarp-web-speech@0.4.1
```

## クイックスタート

```text
when green flag clicked
set recognition language to [ja-JP]
set speech language to [ja-JP]
say (listen and wait)
speak (join [you said ] (recognized text)) and wait

when someone starts speaking
stop speaking
```

## ブロックリファレンス

ブロックリファレンスは[`src/block-definitions.json`](src/block-definitions.json)から生成しています。生成された部分は手で編集しないでください。ブロックの表示文言はTurboWarp上の英語表記のままです。

<!-- BEGIN GENERATED BLOCKS -->

### `speech recognition supported?`

このブラウザで音声認識が使えるかを返します。

| 項目 | 値 |
|---|---|
| 種類 | 真偽値ブロック |
| Opcode | `isRecognitionSupported` |

### `set recognition language to [LANG]`

次に聞き取りを始めるときから使う言語を設定します。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `setRecognitionLanguage` |
| `LANG` | 文字列, 既定値: `ja-JP`, 選択肢: `ja-JP`, `en-US`, `en-GB`, `zh-CN`, `ko-KR`, `fr-FR`, `de-DE`, `es-ES` |

### `start listening [MODE]`

聞き取りを始めます。onceは1回話すと止まり、continuousはstop listeningまで聞き続けます。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `startListening` |
| `MODE` | 文字列, 既定値: `once`, 選択肢: `once`, `continuous` |

### `stop listening`

聞き取りを止めます。認識途中の結果があれば確定させます。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `stopListening` |

### `listening?`

聞き取り中かを返します。

| 項目 | 値 |
|---|---|
| 種類 | 真偽値ブロック |
| Opcode | `isListening` |

### `listen and wait`

1回分の発話を聞き取り、その文字列を返します。認識できなければ空文字列を返します。

| 項目 | 値 |
|---|---|
| 種類 | 値ブロック |
| Opcode | `listenAndWait` |

### `when speech is recognized`

発話が認識されるたびに起動します。

| 項目 | 値 |
|---|---|
| 種類 | ハット |
| Opcode | `whenSpeechRecognized` |

### `when someone starts speaking`

話し始めを検出したときに起動します。利用者が割り込んだときに読み上げを止めるのに使えます。

| 項目 | 値 |
|---|---|
| 種類 | ハット |
| Opcode | `whenSpeechStarts` |

### `recognized text`

直近に認識された発話を返します。

| 項目 | 値 |
|---|---|
| 種類 | 値ブロック |
| Opcode | `recognizedText` |

### `interim recognized text`

話している途中の発話について、ここまでに認識された文字列を返します。

| 項目 | 値 |
|---|---|
| 種類 | 値ブロック |
| Opcode | `interimText` |

### `speech synthesis supported?`

このブラウザで音声合成が使えるかを返します。

| 項目 | 値 |
|---|---|
| 種類 | 真偽値ブロック |
| Opcode | `isSynthesisSupported` |

### `speak [TEXT]`

文字列の読み上げを始め、終わるのを待たずに次のブロックへ進みます。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `speak` |
| `TEXT` | 文字列, 既定値: `こんにちは` |

### `speak [TEXT] and wait`

文字列を読み上げ、終わるか止められるまで待ちます。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `speakAndWait` |
| `TEXT` | 文字列, 既定値: `こんにちは` |

### `stop speaking`

待ち行列にある分も含めて、読み上げを止めます。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `stopSpeaking` |

### `speaking?`

読み上げ中かを返します。

| 項目 | 値 |
|---|---|
| 種類 | 真偽値ブロック |
| Opcode | `isSpeaking` |

### `set speech language to [LANG]`

読み上げの言語を設定します。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `setSpeechLanguage` |
| `LANG` | 文字列, 既定値: `ja-JP`, 選択肢: `ja-JP`, `en-US`, `en-GB`, `zh-CN`, `ko-KR`, `fr-FR`, `de-DE`, `es-ES` |

### `set speech voice to [VOICE]`

名前で声を選びます。使える声はブラウザとOSによって異なります。空にすると、その言語の既定の声を使います。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `setSpeechVoice` |
| `VOICE` | 文字列, 既定値: ``, 選択肢: 実行時にブラウザから読み取る |

### `set speech rate to [RATE]`

読み上げの速さを設定します（0.1〜10、標準は1）。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `setSpeechRate` |
| `RATE` | 数値, 既定値: `1` |

### `set speech pitch to [PITCH]`

読み上げの声の高さを設定します（0〜2、標準は1）。

| 項目 | 値 |
|---|---|
| 種類 | コマンド |
| Opcode | `setSpeechPitch` |
| `PITCH` | 数値, 既定値: `1` |

### `available voices`

このブラウザで使える声の一覧をJSONテキストで返します。

| 項目 | 値 |
|---|---|
| 種類 | 値ブロック |
| Opcode | `voicesJson` |

### `last speech error`

直近の音声認識または音声合成のエラーを返します。エラーがなければ空文字列を返します。

| 項目 | 値 |
|---|---|
| 種類 | 値ブロック |
| Opcode | `lastError` |

<!-- END GENERATED BLOCKS -->

## 重要な動作

| 状況 | 動作 |
|---|---|
| `start listening [once]` | 1回話すと止まる |
| `start listening [continuous]` | `stop listening`まで聞き続ける。ブラウザは無音が続くと聞き取りを終えるが、拡張が自動で再開する |
| 発話が検出されなかった | `last speech error`に記録する。連続モードは聞き取りを続ける |
| マイクの使用が拒否された、マイクがない、サービスに接続できない | 連続モードでも聞き取りを止め、`last speech error`に理由を記録する |
| `listen and wait` | 最初に認識された発話を返す。何も認識されなければ空文字列を返す |
| 読み上げ中に`speak`した | 新しい文字列は、今の読み上げのあとに順番待ちになる |
| `stop speaking` | 今の読み上げと順番待ちの分を止める。`speak and wait`はエラーにならずに先へ進む |
| 存在しない声の名前を指定した | 読み上げの言語の既定の声を使う |
| プロジェクトの停止 | 聞き取りをすぐに止め（マイクを解放し）、読み上げも止める |

## Composition API

Composition APIをimportしても、単独のTurboWarp機能拡張は登録されません。使い方は[英語版README](README.md#composition-api)を参照してください。

## 開発

Node.js 24以上と、`packageManager`で指定したpnpmを使います。

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

## ライセンス

[Mozilla Public License 2.0](LICENSE) (SPDX: `MPL-2.0`).
