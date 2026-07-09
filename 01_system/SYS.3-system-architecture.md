# SYS.3 システムアーキテクチャ設計

## 全体構成

```
┌──────────────────────────────────────────────┐
│           ブラウザ / PWA (単一実行体)          │
│  index.html = HTML(UI) + CSS(テーマ) + JS(app) │
│                                                │
│   ┌───────────┐   ┌────────────────────────┐  │
│   │  UI 層     │   │   アプリケーション層    │  │
│   │ tabs/pages │←→│  状態(db) + レンダリング │  │
│   │ bnav       │   │  + イベントハンドラ     │  │
│   └───────────┘   └───────────┬────────────┘  │
│                                │                │
│                    ┌───────────▼───────────┐    │
│                    │  永続化層 localStorage  │    │
│                    │   key: 'odekake_v1'    │    │
│                    └────────────────────────┘    │
└───────────────┬──────────────────┬──────────────┘
                │                  │
        外部地図(Google Maps)   Geolocation API
        （ナビリンク）          （任意・許可制）
```

## システム要素と割り当て

| 要素 | 責務 | 割り当てる SYR |
|------|------|----------------|
| UI 層（tabs / page / bnav） | 画面遷移・入力・表示 | SYR-01〜05,10〜13,20 |
| アプリ状態 `db` | 全データの単一ソース（trips[], children[], active, theme, seq） | 全機能 |
| 永続化（localStorage） | 端末内保存・後方互換マイグレーション | SYR-N2, N6 |
| 外部地図連携 | 検索/座標URLを別タブで開く | SYR-03, SYR-11 |
| Geolocation 連携 | 許可時のみ座標取得（失敗許容） | SYR-11, N3 |

## 主要なアーキ決定（ADR 要約）

| 決定 | 根拠 | 対応 |
|------|------|------|
| サーバを持たずクライアント完結 | ログイン不要・無料・プライバシー（SYR-N1,N2） | SUP なし、配信は静的 |
| 状態を単一オブジェクト `db` に集約し都度 `persist()` | 実装単純・一貫性確保 | SWE.2 の DataStore |
| 位置取得は「記録を先に確定→座標は後から非同期付与」 | 拒否・遅延でも記録を止めない（SYR-N3） | SWD-recordMoment |
| おでかけ単位に `logs[]` を内包 | 旅と記録の紐付け・共有時に一括移動 | データモデル |
| **AI生成は中継サーバ(Cloudflare Worker)経由で Gemini を呼ぶ**（Stop 3） | **APIキーをクライアントに出さない（SYR-N8）／将来の他家族配布に対応** | worker/ + StoryService |
| **AI送信は最小化＋同意**（Stop 3） | **子どものデータを扱うため（SYR-N7）。Gemini無料枠の学習利用に配慮** | buildStoryPayload |
| **Leaflet/OSMではなく都道府県ボード**（Stop 2） | **オフライン自己完結・外部タイル依存回避** | AtlasView |

## AI連携アーキ（Stop 3 で追加）

```
[ブラウザ: Pages のPWA]  ──① 最小化データ(JSON) POST──▶ [Cloudflare Worker]
   （キーは持たない）                                    │ GEMINI_API_KEY を secret 保持
                                                        │ ② プロンプト整形
                          ◀───④ 物語テキスト(+CORS)──── │ ③ Gemini API 呼び出し（無料枠）
                                                        ▼
                                                 [Google Gemini API]
```
- 送信データ（最小化）：trip名/都道府県/行き先/日付、子のニックネーム＋年齢、イベント集計、予定＋記録の時系列（メモ含む）。**GPS座標・写真・本名は送らない**（SYR-N7）。
- 生成結果は `trip.story` に保存し端末内で再表示。中継URL(`storyUrl`)未設定・失敗時は既存機能を維持（SYR-N9）。

## データモデル（システムレベル）

```
db
├─ trips[] : { id, name, type, dest, pref, start, end,     ← pref: Stop 2 で追加
│              schedule[], meals[], spots[], pack[], budget[], photos[],
│              logs[],                                       ← Stop 1 で追加
│              story?:{text,ts} }                            ← Stop 3 で追加
├─ children[] : { id, name, birth('YYYY-MM') }   ← Stop 1 で追加
├─ active : 選択中 trip の id
├─ theme  : 'light' | 'dark' | null
├─ storyUrl : AI中継Worker の URL（''=未設定）  ← Stop 3 で追加
└─ seq    : ID採番カウンタ
```

ソフトウェア内部の分解は `02_software/SWE.2-software-architecture.md` へ続く。
