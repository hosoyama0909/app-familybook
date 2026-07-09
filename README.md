# 家族おでかけアプリ

家族のおでかけを **計画し・記録し・物語にし・次に活かす** ためのアプリ（PWA）。
「親になった人だけが分かる感情」を形にすることをコンセプトにしている。

- 実装：`index.html`（単一ファイルのPWA・サーバ不要・ログイン不要）
- ロードマップ：`private` リポジトリの `PLAN.md` / `roadmap.html`

## 開発プロセス（A-SPICE テーラリング版）

学習のため、開発を **Automotive SPICE の V字モデル** に沿って進めている。
まず全体像は **[docs/process/aspice-overview-and-tailoring.md](docs/process/aspice-overview-and-tailoring.md)** を参照。

### リポジトリ構成

```
.
├── index.html                  # 実装（SWE.3のユニット構築成果物）
├── CHANGELOG.md                # リリース記録（SUP.8）
├── docs/
│   ├── process/                # プロセス定義・テーラリング・用語
│   ├── system/                 # SYS.1 要求 → SYS.2 分析 → SYS.3 アーキ
│   ├── software/               # SWE.1 要求 → .2 アーキ → .3 設計 → .4/.5/.6 検証
│   ├── traceability/           # トレーサビリティ・マトリクス（中核）
│   └── management/             # MAN.3/5, SUP.8/9/10
├── test/
│   ├── qualification/          # SWE.6 適格性確認テスト（E2E）
│   └── unit/                   # SWE.4 単体テスト（今後）
└── .github/                    # Issue/PR テンプレ（SUP.9/10）
```

### V字モデルと成果物の対応

```
 要求・設計（左）                              検証（右）
 SYS.1 ステークホルダ要求 ───────────────▶ （運用確認）
   └ SYS.2 システム要求 ─────────────▶ SYS.5≒SWE.6 適格性テスト
       └ SYS.3 システムアーキ ─────▶ SWE.5 結合テスト
           └ SWE.1 SW要求 ───────▶ SWE.6 適格性テスト
               └ SWE.2 SWアーキ ─▶ SWE.5 結合テスト
                   └ SWE.3 詳細設計・実装 ─▶ SWE.4 単体検証
```
左右は **トレーサビリティ・マトリクス**（[docs/traceability](docs/traceability/traceability-matrix.md)）で相互リンクしている。

## 新機能を追加する手順（1機能＝ミニV字）
1. Issue で変更依頼（CR）を起票（`.github` テンプレ）
2. `docs/system` `docs/software` の要求に ID を採番して追記
3. アーキ・詳細設計に反映（`SWE.2` `SWE.3`）
4. `index.html` を実装（コミットに要求ID/CR番号）
5. `test/` で検証（`node test/qualification/log-feature.mjs`）
6. トレーサビリティ・マトリクスを更新 → レビュー → merge → タグ

詳細な完了条件は [MAN.3 の Definition of Done](docs/management/MAN.3-project-management.md) を参照。
