# 物語生成 Worker — デプロイ手順

フロント（GitHub Pages）から呼ばれ、Gemini API（無料枠）で家族の物語を生成する
Cloudflare Worker です。**APIキーはこの Worker の中だけに保持**し、アプリ本体（公開ページ）には出しません。

```
[ブラウザ(PWA)] --POST 最小化データ--> [この Worker] --キー付き--> [Gemini API]
                                    <---- 物語テキスト ----
```

## 事前に用意するもの
- Google アカウント（Gemini APIキー取得用）
- Cloudflare アカウント（無料）
- 手元に Node.js（`npx` が使えればOK）

## 手順

### 1. Gemini APIキーを取得（無料）
1. https://aistudio.google.com/apikey を開く
2. 「Create API key」でキーを発行（`AIza…` の文字列）
3. ⚠️ 無料枠は「データがサービス改善に使われる場合がある」ため、本アプリは
   **GPS座標・本名を送らない**設計にしている（送るのはイベント種別・メモ・場所名・日付・ニックネーム/年齢）。

### 2. Worker をデプロイ
このフォルダ（`03_implementation/worker/`）で：

```bash
# 初回のみ Cloudflare にログイン
npx wrangler login

# APIキーを secret として登録（プロンプトに貼り付け）
npx wrangler secret put GEMINI_API_KEY

# 公開元を自分のPagesに絞る（推奨・任意）
#   wrangler.toml の ALLOW_ORIGIN を "https://hosoyama0909.github.io" に変更

# デプロイ
npx wrangler deploy
```

デプロイ成功時に `https://odekake-story.<あなた>.workers.dev` のような **URL** が表示される。

### 3. アプリに URL を設定
1. アプリの「📖 ふりかえり」タブ →「物語をつくる設定」に、上記の Worker URL を貼る
2. 「📖 物語を作る」を押すと生成される

## 動作確認（任意・キー設定後）
```bash
curl -X POST https://odekake-story.<あなた>.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"trip":{"name":"箱根旅行","pref":"神奈川県","start":"2026-07-10","end":"2026-07-11"},
       "children":[{"nick":"長女","age":"5歳2ヶ月"}],
       "moments":{"fuss":2,"spot":1},
       "timeline":[{"t":"11:00","kind":"plan","title":"ユネッサン"},
                   {"t":"13:15","kind":"rec","title":"神スポット","note":"流れるプールで大興奮"}]}'
```
`{"story":"..."}` が返れば成功。

## モデル/コスト
- 既定モデル: `gemini-2.0-flash`（無料枠）。`wrangler.toml` の `GEMINI_MODEL` で変更可。
- Cloudflare Workers も無料枠（1日10万リクエスト）で十分。

## トラブル
| 症状 | 対処 |
|------|------|
| `GEMINI_API_KEY が未設定` | 手順2の `wrangler secret put` を実行 |
| CORSエラー | `ALLOW_ORIGIN` を自分のPages URL（末尾スラッシュ無し）か `*` に |
| `Gemini APIエラー` | キーの有効性・モデル名・無料枠レート上限を確認 |
