# テスト（SWE.4 / SWE.6）

A-SPICE の検証プロセスに対応するテスト置き場。

```
test/
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
node test/qualification/log-feature.mjs
```

成功すると各 `QTC-*` の結果と `✅ 全N件 Pass` が出力され、終了コード 0。
失敗時は終了コード 1（CI で検知可能）。

## 対応表
| テスト | 検証対象 | 仕様 |
|--------|----------|------|
| log-feature.mjs | きろく機能・お子さん登録・保持・回帰 | `docs/software/SWE.5-6-integration-qualification-test.md` |

## TODO
- `unit/` に `ageStr` 等の純関数テストを追加（DOM非依存）。
- GitHub Actions で push 時に自動実行（`docs/management/SUP.8-9-10-*` 参照）。
