# CLAUDE.md — 家族おでかけアプリ 開発ガイド

新しいセッションはこのファイルを最初に読む。ここに**このリポジトリの開発の流儀**をまとめる。
オーナーの背景・事業プラン・引き継ぎは、非公開リポジトリ `hosoyama0909/private` の
`CLAUDE.md` / `HANDOFF.md` / `STOP5-ROADMAP.md` を参照（Public なこのリポには個人情報を書かない）。

---

## このリポジトリは何か

- 「家族おでかけアプリ」。**計画→記録→物語→学習→形に残す** を一周させる家族向け PWA。
- 実装は **単一 HTML の PWA**：`03_implementation/index.html`（外部ライブラリ非依存・localStorage 保存・ログイン不要）。
- AI 機能（物語・手紙）は **Cloudflare Worker 経由で Gemini** を呼ぶ：`03_implementation/worker/`。
  - Worker は **汎用リレー**（`payload.prompt` を受けて Gemini に渡すだけ）。プロンプトはアプリ側で組む
    → 新しい AI 機能を足しても **Worker の再デプロイは不要**。
  - 既定モデル **`gemini-flash-lite-latest`**（無料枠で安定。混雑時は自動フォールバック）。

---

## 開発プロセス（A-SPICE テーラリング版）

学習も兼ねて **Automotive SPICE の V字モデル**に沿う。全体像は
`00_process/aspice-overview-and-tailoring.md`。

### リポジトリ構成（V字の流れ順に採番）
```
00_process/        プロセス定義・テーラリング・用語
01_system/         SYS.1 要求 → SYS.2 分析 → SYS.3 アーキ
02_software/       SWE.1 要求 → .2 アーキ → .3 詳細設計 → .5-6 検証仕様
03_implementation/ index.html（本体）＋ worker/（Cloudflare Worker）
04_test/           SWE.6 適格性テスト（Playwright）
05_traceability/   トレーサビリティ・マトリクス（中核）
06_management/     MAN.3/5・SUP.8/9/10
index.html         直下＝本体への転送ページ（?v=時刻でキャッシュ回避）
```

### 1機能を追加する流れ（毎回これで回す）
1. **CR 起票**（GitHub Issue, `change-request` ラベル）＝何を・なぜ
2. `01_system`/`02_software` の要求に **ID 採番**（SYR-/SWR-）
3. アーキ・詳細設計に反映（`02_software/SWE.2`・`SWE.3`）
4. `03_implementation/index.html` を実装（コミットに要求ID/CR番号を書く）
5. `04_test/` で検証（下記コマンド）
6. **`05_traceability` を更新** → PR → セルフレビュー → マージ → CR クローズ
7. リリース時は `CHANGELOG.md` 追記（＋必要ならタグ）

完了条件（DoD）は `06_management/MAN.3-project-management.md`。

---

## テスト

適格性テストは Playwright（headless Chromium）。この開発環境なら：
```bash
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
npm i -D playwright-core            # 初回のみ
export CHROMIUM_BIN=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
node 04_test/qualification/log-feature.mjs         # 例
```
- 変更を入れたら **関連スイート＋回帰**を通す（`04_test/qualification/*.mjs`）。
- Worker/Gemini の実呼び出しは外部依存のため **テストではモック**する。

---

## 配信（GitHub Pages）

- **ブランチ配信（Deploy from a branch / root）**。`main` にマージすれば自動反映。
- 直下 `index.html` が本体 `03_implementation/index.html` へ `?v=時刻` 付きで転送
  → 更新後に古い画面がキャッシュで残らない。
- 公開URL：**https://hosoyama0909.github.io/app-familybook/**
- GitHub Actions 配信は**使わない**（特定フォルダをルート化して複数アプリ構想と競合するため）。

---

## Git 運用

- 開発ブランチ：`claude/parenting-emotions-app-wud3xg`。**機能ごとに main から作り直す**（同名でOK）。
- コミットメッセージに要求ID/CR番号を含める。
- PR はセルフレビュー（＋必要時 AI レビュー）。マージで公開反映。

---

## オーナーの前提（詳細は private/CLAUDE.md）

- プロのソフトウェアエンジニア。**説明は簡潔でよい**が、**設計判断の理由**は一言添える。
- **デザインはシンプル志向**。小さな子どもも使うので**大きめのタップ領域・分かりやすい導線**。
- 実データ（氏名・住所等）はコードに書かない。localStorage に保存。

---

## 現在地（2026-07 時点）

- Stop 0–4 実装済み（しおり／きろく／ふりかえり／都道府県／AI物語・手紙・大賞・冊子PDF／親HP・まなび・提案）。
- 次の大テーマは **Stop 5（事業化）**：順序 **B→A→C→D**（private の `STOP5-ROADMAP.md`）。
  まず B（クローズドテスト）＝今の形で家族に使ってもらい検証。
