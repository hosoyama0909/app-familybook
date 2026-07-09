# SWE.4 ソフトウェア単体検証

各ユニット（SWD-*）の検証。現段階は**設計レビュー＋境界値の手動/自動確認**で
PA1.1（実施）を満たす。将来はユニットテストを `/test/unit/` に自動化する（下記TODO）。

## 単体テストケース

| ID | 対象ユニット | 入力/条件 | 期待結果 | 割当 | 状態 |
|----|--------------|-----------|----------|------|------|
| UTC-AGE-01 | ageStr | birth='2021-05'（基準2026-07） | '5歳2ヶ月' | SWR-CHILD-02 | ✅ Pass(E2Eで確認) |
| UTC-AGE-02 | ageStr | birth=当月 | '0歳0ヶ月' | SWR-CHILD-02 | ✅ 設計上保証 |
| UTC-AGE-03 | ageStr | birth=未来月 | '0歳0ヶ月'（負値クランプ） | SWR-CHILD-02 | ✅ 設計上保証 |
| UTC-LOG-01 | recordMoment | tr未選択 | 記録されずtoast警告 | SWR-LOG-02 | ✅ 設計上保証 |
| UTC-LOG-02 | recordMoment | geo拒否 | log は時刻付きで残る(lat無し) | SWR-LOG-03 | ✅ E2E(QTC-LOG-02) |
| UTC-LOG-03 | recordMoment | memo入力あり | log.memoに反映＆入力欄クリア | SWR-LOG-04 | ✅ E2E |
| UTC-MIG-01 | migration | logs無しの旧trip読込 | t.logs=[]に補完しエラー無し | SWR-DATA-02 | ✅ E2E(既存seed) |
| UTC-DEL-01 | renderLog削除 | 複数日ログの1件削除 | 指定idのみ消える | SWR-LOG-08 | ✅ 設計(id指定) |

## レビュー観点（コードレビューチェックリスト）
- [x] 記録確定と位置取得が分離され、失敗時も記録が残るか（SWR-LOG-03）
- [x] 削除が index でなく id ベースか（並べ替え耐性）
- [x] 入力の `esc()` によるXSS対策（memo/名前をエスケープして描画）
- [x] localStorage 例外時に toast で通知（容量オーバー）
- [x] 既存レンダリング関数への副作用が無いか（renderAll へ renderLog 追加のみ）

## TODO（能力レベル向上）
- [ ] `ageStr` 等の純関数を自動ユニットテスト化（Node, DOM非依存）→ `/test/unit/`
- [ ] CI（GitHub Actions）で push 時に自動実行

> 現状 `recordMoment/renderLog` は DOM 依存のため E2E（SWE.6）で検証している。
> 純ロジック（ageStr, 集計）を関数抽出できればここで単体自動化できる（リファクタ候補）。
