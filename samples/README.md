# Web Speech 最小デモ

[Editorで開く](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-web-speech%2Fsamples%2Fspeak-one-sentence.sb3) · [SB3](https://kubohiroya.github.io/turbowarp-web-speech/samples/speak-one-sentence.sb3)

拡張を許可して緑の旗を押し、青い「Speak」スプライトをクリックすると、speakAndWaitで「Hello, TurboWarp!」を1回読み上げます。Speech statusがFinishedになり、Speech errorが空なら合成完了です。停止ボタンで読み上げと待ち行列を取り消し、再クリックで発話できます。音声認識・マイクは使いません。ブラウザ/OSの音声合成と出力音量が必要です。supported=falseやエラーが出る環境ではブラウザ/OSの音声設定を確認してください。voices一覧が空でも既定音声で動作する環境があります。利用できる声や実際に聞こえる音はOS・出力設定に依存します。

## 編集と配信

`speak-one-sentence/project.json`とSVGを編集し、Node.js 26で`node scripts/build-samples.mjs`を実行します。生成SB3をコミットし、`node scripts/build-samples.mjs --check`と`node --test scripts/verify-samples.mjs`で検査します。`node scripts/prepare-pages.mjs`は既存サイト・dist・SB3を`_site/`へ集約します。

unsandboxed拡張の検証対象JSをSB3に同梱し、Editorの通常の許可画面を使用します。本体や既定フラグを変更しません。切戻しはサンプル・READMEリンク・Pages追加のrevertです。
