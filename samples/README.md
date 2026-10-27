# Web Speech 最小デモ

[Editorで開く](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-web-speech%2Fsamples%2Fspeak-one-sentence.sb3) · [SB3](https://kubohiroya.github.io/turbowarp-web-speech/samples/speak-one-sentence.sb3)

初期選択は日本語音声のKyokoです。Kyokoが利用できない環境では発話しません。ステージのコードにある「Voice name を（音声メニュー）にする」のドロップダウンで、一覧に表示された日本語（ja / ja-JP）の声を選び、緑の旗で設定を反映します。「Japanese voice found」がtrueになったら、聞きたいときに青いSpeakスプライトをクリックします。setSpeechVoiceで指定した声を使い、日本語・速度1・高さ1で短文を読み上げます。未選択・声の一覧が空・選んだ日本語音声が現在の一覧にない場合は発話しません。緑の旗だけでは発話しません。停止ボタンで出力と待ち行列を取り消します。音声認識やマイクは使いません。音声はブラウザ/OSの導入状況で異なり、一覧が空ならOSの日本語音声設定を確認してページを再読込してください。声質・聞こえ方は利用者の環境で確認してください。

## 編集と配信

`speak-one-sentence/project.json`とSVGを編集し、Node.js 26で`node scripts/build-samples.mjs`を実行します。生成SB3をコミットし、`node scripts/build-samples.mjs --check`と`node --test scripts/verify-samples.mjs`で検査します。`node scripts/prepare-pages.mjs`は既存サイト・dist・SB3を`_site/`へ集約します。

unsandboxed拡張の検証対象JSをSB3に同梱し、Editorの通常の許可画面を使用します。本体や既定フラグを変更しません。切戻しはサンプル・READMEリンク・Pages追加のrevertです。

## 検証方針

自動検証は未選択・利用できない声で発話しないこと、menu設定・日本語・速度/高さのブロックと停止状態までを無音で確認します。選択後の声質を確認する発話は利用者が明示操作したときだけ行います。
