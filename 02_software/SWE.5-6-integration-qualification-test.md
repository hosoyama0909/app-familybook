# SWE.5 結合テスト / SWE.6 適格性確認テスト

単一実行体のため SYS.4/SYS.5 をここに統合（テーラリング）。
コンポーネント結合（DataStore⇄MomentLogger⇄LogView⇄localStorage）と、
利用者視点の適格性を **実ブラウザ（Playwright/Chromium）E2E** で確認する。

## テスト対象・環境
- 対象：`03_implementation/index.html`（Stop 1 リリース）
- 実行：`04_test/qualification/log-feature.mjs`（Chromium headless, viewport 390×844）
- 実行方法：`test/README.md` を参照。

## 適格性テストケース

| ID | シナリオ | 期待結果 | 割当(SWR/SYR) | 結果 |
|----|----------|----------|---------------|------|
| QTC-LOG-01 | きろくタブを開く→😭と🍼を記録 | 記録2件・サマリー"😭×1 🍼×1"・タイムライン表示 | SWR-LOG-01,02,05,06 | ✅ Pass |
| QTC-LOG-02 | 位置情報を付与せず記録 | 記録は時刻付きで成立（0件にならない） | SWR-LOG-03 / SYR-N3 | ✅ Pass |
| QTC-LOG-03 | メモを入れて記録 | log.memo反映＆入力欄クリア | SWR-LOG-04 | ✅ Pass |
| QTC-CHILD-01 | 生年月2021-05で登録 | "5歳2ヶ月"表示（基準2026-07） | SWR-CHILD-02 | ✅ Pass |
| QTC-DATA-01 | 記録後リロード | 記録・お子さんが保持される | SWR-DATA-01 | ✅ Pass |
| QTC-REG-01 | スケジュールタブ表示 | 既存seed予定が従来通り描画 | SWR-CORE-01 | ✅ Pass |
| QTC-NFR-01 | ライト/ダーク両テーマ表示 | 破綻なく可読 | SYR-N4 | ✅ Pass(目視) |

### Stop 2（ふりかえり / 都道府県ヒストリー）— `04_test/qualification/stop2-recap-atlas.mjs`

| ID | シナリオ | 期待結果 | 割当(SWR/SYR) | 結果 |
|----|----------|----------|---------------|------|
| QTC-REC-01 | 記録2件後にふりかえり表示 | 予定12+実績2=14行が時系列統合、予定タグ12 | SWR-REC-01,02 | ✅ Pass |
| QTC-REC-02 | ふりかえりのサマリー | 予定/きろく/写真/イベント集計を表示 | SWR-REC-03 | ✅ Pass |
| QTC-PREF-01 | ちず初期表示（seed=神奈川） | 1/47・神奈川が色付き | SWR-PREF-02,03 | ✅ Pass |
| QTC-PREF-02 | 神奈川タップ→開く | 箱根がカプセル表示、開くとふりかえりへ遷移 | SWR-PREF-04 | ✅ Pass |
| QTC-PREF-03 | 都道府県を東京に変更 | 東京が色付き・保存に反映 | SWR-PREF-01 | ✅ Pass |
| QTC-REG-02 | スケジュール回帰 | 既存予定が従来通り描画 | SWR-CORE-01 | ✅ Pass |

## 実行記録
Stop 1（2026-07-09）
```
{ errors: [], logVisible: true, momentBtns: 6, summary: "😭 ×1🍼 ×1",
  logRows: 2, stored: { logs: 2, children: 1, memo: "おなかすいた" },
  afterReload: 2, schedRows: 5 }  → 全8件 Pass
```
Stop 2（2026-07-09）
```
QTC-REC-01 rows=14 rec=2 plan=12 / QTC-PREF-01 1/47 神奈川v1 /
QTC-PREF-02 capsule=true jumped=true / QTC-PREF-03 saved=東京都
→ 全7件 Pass。コンソールエラー無し。Stop 1 回帰 全8件 Pass 維持。
```

## トレーサビリティ
全 QTC は `05_traceability/traceability-matrix.md` で SWR/SYR/STK まで遡れる。

## 未カバー（次リリースで追加）
- 位置付き記録の🧭ナビリンク遷移（外部遷移のため手動確認）。
- 大量ログ時の描画性能（Stop 2 のマップ導入時に合わせて計測）。
