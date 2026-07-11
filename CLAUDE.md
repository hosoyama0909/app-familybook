# CLAUDE.md（app-familybook リポジトリ）

家族のおでかけを計画・記録するアプリ（単一ファイル PWA）。公開URL: https://hosoyama0909.github.io/app-familybook/

## やり取りの前提（プロジェクト共通）

- オーナーは **勇騎さん**（プロのソフトウェアエンジニア）。コード説明は簡潔でよく、設計判断の理由は一言添える。
- **PR・コミットメッセージ・Issue は日本語で書く**（タイトルも本文も）。英語だけにしない。
- デザインはシンプル志向。家族（小さい子ども）も使う → 大きめタップ領域・分かりやすい導線。
- 個人の実データ・秘密情報はコードにもリポジトリにも書かない。端末内の `localStorage` に保存。

## このリポ固有

- 開発は **A-SPICE の V字モデル** に沿う。全体像は `README.md` / `00_process/` を参照。
- 実装本体は **`03_implementation/index.html`**（単一ファイル・サーバ不要・ログイン不要）。リポジトリ直下の `index.html` はそこへの転送ページ。
- Pages はブランチ配信（`main` / ルート）。転送ページが `03_implementation/index.html` を開く。
- 詳しいプロフィール／方針は Private リポジトリ `docs-private` の `CLAUDE.md` を参照。
