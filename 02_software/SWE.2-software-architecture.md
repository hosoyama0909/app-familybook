# SWE.2 ソフトウェアアーキテクチャ設計

`index.html` 内の IIFE（`(function(){ ... })()`）を、論理コンポーネントに分解する。
全コンポーネントは単一状態 `db` を共有し、変更後に `persist()` で永続化する。

## コンポーネント図

```
                ┌──────────────┐
                │   Router     │ go(id): タブ/ページ/bnav 切替
                └──────┬───────┘
                       │
   ┌───────────────────┼───────────────────────────┐
   │                   │                            │
┌──▼─────────┐  ┌──────▼────────┐  ┌────────────────▼───┐
│ TripManager │  │  LogView       │  │ ChildRegistry       │
│ home/作成    │  │ renderLog      │  │ renderKids/ageStr   │
│ renderHome   │  │ 当日サマリー   │  │ お子さん登録        │
└──┬──────────┘  └──────┬────────┘  └─────────┬──────────┘
   │                    │                     │
   │             ┌──────▼────────┐            │
   │             │ MomentLogger   │ recordMoment / lastGeo キャッシュ
   │             └──────┬────────┘            │
   │                    │                     │
   │   （他: SchedView / MealView / MapView / PhotoView / PackView / BudgetView）
   │                    │                     │
   └──────────┬─────────┴──────────┬──────────┘
              │                    │
        ┌─────▼──────┐      ┌──────▼─────────┐
        │  DataStore  │      │  GeoService     │
        │ db/persist  │      │ navigator.geo   │
        │ T()/esc/... │      │ （任意・許可制） │
        └─────┬──────┘      └────────────────┘
              │
        ┌─────▼────────────┐
        │ localStorage      │ key 'odekake_v1'
        └───────────────────┘
```

## コンポーネント定義とインタフェース

| コンポーネント | 責務 | 主なI/F | 割当 SWR |
|----------------|------|---------|----------|
| DataStore | 状態保持・永続化・共通ユーティリティ | `db`, `persist(show)`, `T()`, `esc()`, `fdate()`, `pad()` | SWR-DATA-01,02,03 |
| GeoService | 位置取得（任意・失敗許容）とキャッシュ | `navigator.geolocation`, `lastGeo/lastGeoAt` | SWR-LOG-03 |
| MomentLogger | イベント記録の生成 | `recordMoment(k)`, `MOMENTS`, `MOMENT_MAP` | SWR-LOG-01〜04 |
| LogView | 記録の集計・タイムライン描画 | `renderLog()`, `logTime()`, `dayLabel()` | SWR-LOG-05,06,07,08 |
| ChildRegistry | お子さん登録と年齢算出 | `renderKids()`, `ageStr(birth)`, `#kidAdd` | SWR-CHILD-01,02,03 |
| RecordView（Stop2） | 予定+実績の統合ふりかえり描画 | `renderRecap()` | SWR-REC-01,02,03 |
| AtlasView（Stop2） | 都道府県の集計・塗り分け・タイムカプセル | `renderAtlas()`, `prefCounts()`, `showCapsule(pref)`, `REGIONS/PREFS` | SWR-PREF-01〜04 |
| StoryService（Stop3/4） | 物語・手紙の要求組立・送信・保存・描画 | `renderStory()`, `buildStoryPrompt()`, `buildLetterPrompt()`, `tripFactsText()`, `generateStory()`, `generateLetter()`, `db.storyUrl` | SWR-STORY-*, SWR-LETTER-* |
| StoryWorker（別デプロイ・汎用リレー） | キー秘匿・Gemini代理。payload.prompt優先＋モデル自動フォールバック | `worker/story-worker.js` | SWR-WORKER-01,02 / SYR-N8 |
| InsightsEngine（Stop4・AI不要） | 記録からの集計・学習・提案 | `tripHP()`, `learnInsights()`, `renderHomeInsights()`, `openingSuggestion()` | SWR-HP-01, SWR-LEARN-01, SWR-OPEN-01 |
| Router | 画面遷移。recap/atlas は表示時に再集約 | `go(id)`（recap/atlasで再render） | SYR-N4, SWR-REC/PREF |
| TripManager 他 View | 既存機能（回帰対象） | `renderHome/Sched/...` | SWR-CORE-01 |

## 静的・動的側面
- **静的**：全コンポーネントは DataStore の `db` に依存（単方向）。UI層はDOM id で結合。
- **動的（記録シーケンス）**：
  1. ユーザがボタン押下 → MomentLogger.recordMoment(k)
  2. logを即 push → DataStore.persist（記録確定）
  3. LogView.renderLog（画面更新）
  4. GeoService が非同期に座標取得成功 → 該当logへ付与 → persist → renderLog
  （3で完結。4は任意・後追い＝SWR-LOG-03を満たす）

詳細は `SWE.3-detailed-design.md` へ。
