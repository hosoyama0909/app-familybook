# トレーサビリティ・マトリクス

A-SPICE の中核。**上流（なぜ）から下流（実装・テスト）まで双方向にたどれる**ことを保証する。
Stop 1（きろく機能・お子さん登録）を主対象に完全トレースを示し、既存機能は概略で示す。

## 1. 縦のトレース（STK → テスト）：きろく機能

| STK | SYR | SWR | SWA(コンポーネント) | SWD(設計) | 実装(index.html) | テスト |
|-----|-----|-----|--------------------|-----------|------------------|--------|
| STK-02 | SYR-10 | SWR-LOG-01 | LogView/MomentLogger | MOMENTS×6 | `#moments`生成 | QTC-LOG-01a |
| STK-02 | SYR-10,11 | SWR-LOG-02 | MomentLogger | SWD-recordMoment | `recordMoment()` | QTC-LOG-01b, UTC-LOG-01 |
| STK-02,05 | SYR-11 / N3 | SWR-LOG-03 | MomentLogger/GeoService | SWD-recordMoment | geo後追い付与 | QTC-LOG-02, UTC-LOG-02 |
| STK-02 | SYR-10 | SWR-LOG-04 | MomentLogger | SWD-recordMoment | `#lgMemo`処理 | QTC-LOG-03, UTC-LOG-03 |
| STK-03 | SYR-12 | SWR-LOG-05 | LogView | SWD-renderLog | `#lgsummary`集計 | QTC-LOG-01b |
| STK-03 | SYR-12 | SWR-LOG-06 | LogView | SWD-renderLog | 日別グループ描画 | QTC-LOG-01b |
| STK-04 | SYR-03,11 | SWR-LOG-07 | LogView | SWD-renderLog | 🧭ナビリンク | 手動 |
| STK-02 | SYR-10 | SWR-LOG-08 | LogView | SWD-renderLog | id指定削除 | UTC-DEL-01 |

## 2. 縦のトレース：お子さん登録

| STK | SYR | SWR | SWA | SWD | 実装 | テスト |
|-----|-----|-----|-----|-----|------|--------|
| STK-05 | SYR-13 | SWR-CHILD-01 | ChildRegistry | `#kidAdd` | 登録ハンドラ | QTC-CHILD-01 |
| STK-05 | SYR-13 | SWR-CHILD-02 | ChildRegistry | SWD-ageStr | `ageStr()` | UTC-AGE-01/02/03, QTC-CHILD-01 |
| STK-05 | SYR-13 | SWR-CHILD-03 | ChildRegistry | renderKids | 削除ハンドラ | 手動 |

## 3. 横断（データ・非機能）

| SYR | SWR | 実装 | テスト |
|-----|-----|------|--------|
| SYR-N2,N6 | SWR-DATA-01 | `persist()`/localStorage | QTC-DATA-01 |
| SYR-N6 | SWR-DATA-02 | migration `forEach` | UTC-MIG-01 |
| SYR-20 | SWR-DATA-03 | 書出/取込はdb一括 | 手動 |
| 回帰 | SWR-CORE-01 | 既存render関数 | QTC-REG-01 |

## 3.5 縦のトレース：Stop 2（ふりかえり / 都道府県ヒストリー）

| STK | SYR | SWR | SWA(コンポーネント) | SWD(設計) | 実装(index.html) | テスト |
|-----|-----|-----|--------------------|-----------|------------------|--------|
| STK-03 | SYR-14 | SWR-REC-01 | RecordView | SWD-renderRecap | `renderRecap()` 統合整列 | QTC-REC-01 |
| STK-03 | SYR-14 | SWR-REC-02 | RecordView | SWD-renderRecap | 予定/記録タグ | QTC-REC-01 |
| STK-03 | SYR-14 | SWR-REC-03 | RecordView | SWD-renderRecap | rstatsサマリー | QTC-REC-02 |
| STK-04 | SYR-15 | SWR-PREF-01 | AtlasView | SWD-renderAtlas | `#prefSel` onchange | QTC-PREF-03 |
| STK-04 | SYR-15 | SWR-PREF-02 | AtlasView | SWD-renderAtlas/prefCounts | 地方別chip濃淡 | QTC-PREF-01 |
| STK-04 | SYR-15 | SWR-PREF-03 | AtlasView | SWD-renderAtlas | SVGリング | QTC-PREF-01 |
| STK-04,03 | SYR-15,14 | SWR-PREF-04 | AtlasView/RecordView | SWD-showCapsule | `showCapsule()`→go('recap') | QTC-PREF-02 |

## 3.6 縦のトレース：Stop 3（AI物語）

| STK | SYR | SWR | SWA(コンポーネント) | SWD(設計) | 実装 | テスト |
|-----|-----|-----|--------------------|-----------|------|--------|
| STK-03 | SYR-16 | SWR-STORY-01 | StoryService | SWD-story | `#genStory`→generateStory | QTC-STORY-01 |
| STK-07 | SYR-N7 | SWR-STORY-02 | StoryService | buildStoryPayload | GPS/写真/本名を除外 | QTC-STORY-02 |
| STK-07 | SYR-N7 | SWR-STORY-03 | StoryService | renderStory | 同意文表示 | QTC-STORY-02(目視) |
| STK-03 | SYR-16 | SWR-STORY-04 | StoryService | SWD-story | `trip.story` 保存/再表示 | QTC-STORY-03 |
| STK-07 | SYR-N8 | SWR-STORY-05 | StoryService | renderStory | `storyUrl` 設定導線 | QTC-STORY-01(前提) |
| STK-06 | SYR-N9 | SWR-STORY-06 | StoryService | generateStory catch | 失敗時トースト・保持 | QTC-STORY-04 |
| STK-07 | SYR-N8 | SWR-WORKER-01 | StoryWorker | worker/story-worker.js | Gemini代理・CORS・secret | 手動(curl) |

## 4. 既存機能（Stop 0）概略トレース
| STK | SYR | 実装(index.html) |
|-----|-----|------------------|
| STK-01 | SYR-01 | renderHome / ntAdd |
| STK-01 | SYR-02 | renderSched / evAdd |
| STK-01 | SYR-03 | mapUrl / renderMap / renderMeals |
| STK-01 | SYR-04 | renderPack / renderBudget / renderPhotos |
| STK-01 | SYR-05 | updateCountdown / updateChips |

## 5. カバレッジ・サマリー
- STK 8件中、Stop 0–3 で **STK-01,02,03,04,05(土台),06,07** をカバー。STK-08 は全体で継続。
- 全 SWR-LOG-* / SWR-CHILD-* / SWR-REC-* / SWR-PREF-* / SWR-STORY-* が **実装＋テストに到達**（孤立要求なし）。
  ただし SWR-WORKER-01 の実データ疎通のみデプロイ後の手動curl検証（外部依存のため）。
- 孤立コード（要求に紐づかない実装）＝なし。

> 更新ルール：要求 or 実装を変えたら、必ずこの表の該当行を更新してから merge する（一貫性維持）。
