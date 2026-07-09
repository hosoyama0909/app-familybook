# 家族おでかけアプリ

家族のおでかけを **計画し・記録し・物語にし・次に活かす** ためのアプリ（PWA）。
「親になった人だけが分かる感情」を形にすることをコンセプトにしている。

- 実装：`03_implementation/index.html`（単一ファイルのPWA・サーバ不要・ログイン不要）
- ロードマップ：`private` リポジトリの `PLAN.md` / `roadmap.html`
- 公開URL（GitHub Pages）：https://hosoyama0909.github.io/main/ （下記「配信」参照）

## 開発プロセス（A-SPICE テーラリング版）

学習のため、開発を **Automotive SPICE の V字モデル** に沿って進めている。
まず全体像は **[00_process/aspice-overview-and-tailoring.md](00_process/aspice-overview-and-tailoring.md)** を参照。

### リポジトリ構成（V字の流れ順に採番）

```
.
├── 00_process/          # プロセス定義・テーラリング・用語
├── 01_system/           # SYS.1 要求 → SYS.2 分析 → SYS.3 アーキ
├── 02_software/         # SWE.1 要求 → .2 アーキ → .3 詳細設計 → .4/.5/.6 検証仕様
├── 03_implementation/   # index.html（実装＝SWE.3のユニット構築成果物・配信対象）
├── 04_test/             # SWE.6 適格性テスト(qualification) / SWE.4 単体(unit)
├── 05_traceability/     # トレーサビリティ・マトリクス（中核）
├── 06_management/       # MAN.3/5, SUP.8/9/10
├── .github/             # Issue/PRテンプレ（SUP.9/10）・Pages配信ワークフロー
├── README.md / CHANGELOG.md
```

番号は **V字モデルの読み順**（要求→設計→実装→検証→トレース→管理）に対応している。

### V字モデルと成果物の対応

```
 要求・設計（左）                              検証（右）
 01 SYS.1 ステークホルダ要求 ───────────▶ （運用確認）
   01 SYS.2 システム要求 ─────────────▶ 04 SWE.6 適格性テスト
     01 SYS.3 システムアーキ ─────────▶ 04 SWE.5 結合テスト
       02 SWE.1 SW要求 ───────────────▶ 04 SWE.6 適格性テスト
         02 SWE.2 SWアーキ ───────────▶ 04 SWE.5 結合テスト
           02/03 SWE.3 詳細設計・実装 ─▶ 04 SWE.4 単体検証
```
左右は **[05_traceability/traceability-matrix.md](05_traceability/traceability-matrix.md)** で相互リンクしている。

## 新機能を追加する手順（1機能＝ミニV字）
1. Issue で変更依頼（CR）を起票（`.github` テンプレ）
2. `01_system` `02_software` の要求に ID を採番して追記
3. アーキ・詳細設計に反映（SWE.2 / SWE.3）
4. `03_implementation/index.html` を実装（コミットに要求ID/CR番号）
5. `04_test/` で検証（`node 04_test/qualification/log-feature.mjs`）
6. トレーサビリティ・マトリクスを更新 → レビュー → merge → タグ

詳細な完了条件は [MAN.3 の Definition of Done](06_management/MAN.3-project-management.md) を参照。

## 配信（GitHub Pages）

`03_implementation/` を Pages で公開する。ブランチソースは root か `/docs` しか
選べず番号付きフォルダを配信できないため、**GitHub Actions 方式**を使う
（`.github/workflows/deploy-pages.yml`）。有効化手順：

1. GitHub の対象リポジトリ → **Settings** → 左メニュー **Pages**
2. **Build and deployment › Source** を **「GitHub Actions」** に変更
3. `main` に push（またはマージ）すると `deploy-pages` ワークフローが走る
4. 数十秒後、**https://hosoyama0909.github.io/main/** で公開（ActionsタブやPages画面でURL確認可）

> このワークフローは `03_implementation` の中身をサイトのルートとして配信するので、
> `index.html` はURL直下で開ける。手動配信は Actions タブ → deploy-pages → Run workflow。
