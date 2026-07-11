# テスト（SWE.4 / SWE.6）

A-SPICE の検証プロセスに対応するテスト置き場。

```
04_test/
├── qualification/   # SWE.6 適格性確認テスト（実ブラウザE2E）
│   └── log-feature.mjs
└── unit/            # SWE.4 単体テスト（純ロジック, 今後追加）
```

## 適格性テストの実行

Chromium と Playwright(core) が必要。この開発環境では Chromium が
`/opt/pw-browsers` にプリインストールされている。

```bash
# 1. playwright-core を用意（初回のみ）
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
npm i -D playwright-core

# 2. 実行（Chromiumのパスは環境変数で上書き可）
export CHROMIUM_BIN=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
node 04_test/qualification/log-feature.mjs
```

成功すると各 `QTC-*` の結果と `✅ 全N件 Pass` が出力され、終了コード 0。
失敗時は終了コード 1（CI で検知可能）。

## 対応表
| テスト | 検証対象 | 仕様 |
|--------|----------|------|
| log-feature.mjs | きろく機能・お子さん登録・保持・回帰 | `02_software/SWE.5-6-integration-qualification-test.md` |
| stop2-recap-atlas.mjs | ふりかえり・都道府県ヒストリー・回帰 | `02_software/SWE.5-6-integration-qualification-test.md` |
| stop3-story.mjs | AI物語のクライアント統合（Worker応答はモック）・回帰 | `02_software/SWE.5-6-integration-qualification-test.md` |
| stop4-letter-learn.mjs | 子どもへの手紙（モック）・親HP・学習・開拓提案・回帰 | `02_software/SWE.5-6-integration-qualification-test.md` |
| ui-batch.mjs | Undo・予定編集・きろく日付変更・持ち物カウント | `02_software/SWE.5-6-integration-qualification-test.md` |

## TODO
- `unit/` に `ageStr` 等の純関数テストを追加（DOM非依存）。
- GitHub Actions で push 時に自動実行（`06_management/SUP.8-9-10-*` 参照）。
