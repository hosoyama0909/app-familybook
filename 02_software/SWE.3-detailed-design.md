# SWE.3 詳細設計・ユニット構築

実装は `03_implementation/index.html` の `<script>` 内。ここでは主要ユニットのアルゴリズムを、
実装と対応付けて記述する（コード自体が構築成果物）。

## SWD-recordMoment（MomentLogger）
割当：SWR-LOG-02, 03, 04

```
recordMoment(k):
  tr ← T()                              # 選択中のおでかけ
  if tr 無し: toast, return
  memo ← #lgMemo の値(trim)
  log ← { id, k, ts:Date.now(), memo }  # ← 記録を即確定
  fresh ← lastGeo があり 120秒以内か
  if fresh: log.lat/lng ← lastGeo       # 直近座標を再利用
  tr.logs.push(log); #lgMemo クリア
  persist(false)                        # ← ここで保存完了（SWR-LOG-03の"記録は成立"）
  toast(絵文字+名称)
  renderLog()
  if (not fresh) and geolocation対応:
     getCurrentPosition(
       success: lastGeo更新 → 当該logにlat/lng付与 → persist → renderLog,  # 後追い
       error:  何もしない,                                                # 失敗許容
       {enableHighAccuracy:false, timeout:8000, maximumAge:120000})
```
**設計意図**：位置取得の成否と記録の成否を分離。拒否/遅延でも記録は残る（SYR-N3）。
座標は120秒キャッシュで再プロンプト・電池消費を抑制。

## SWD-ageStr（ChildRegistry）
割当：SWR-CHILD-02

```
ageStr(birth 'YYYY-MM'):
  by,bm ← 分解
  months ← (今年*12 + 今月) − (by*12 + bm)   # 総月数
  if months < 0: months ← 0                  # 未来日ガード
  return floor(months/12) + '歳' + (months%12) + 'ヶ月'
```
**境界**：生年月=当月 → 0歳0ヶ月。未来 → 0歳0ヶ月にクランプ。

## SWD-renderLog（LogView）
割当：SWR-LOG-05, 06, 07, 08

```
renderLog():
  tr ← T(); if 無し: 空表示 + renderKids; return
  logs を当日(fdate=today)で件数集計 → #lgsummary に "絵文字 ×n" チップ
  logs を日付キーで byDate にグループ化
  日付を降順、各日内は ts 降順に整列して描画:
     行 = [ HH:MM | 絵文字+名称 | (memo・📍) | 位置ありなら🧭 | ✕ ]
  ✕ は log.id で filter 削除（indexずれ回避のため id 指定）
  renderKids()
```
**設計意図**：削除は配列indexでなく `id` を使う（日跨ぎ・並べ替えでずれないため）。

## SWD-migration（DataStore）
割当：SWR-DATA-02

```
起動時（seq初期化の直後）:
  if db.children が配列でない: db.children ← []
  各 trip t: if t.logs が配列でない: t.logs ← []
```
seed生成・新規おでかけ作成の双方で `logs:[]` を初期化。

## データ構造（詳細）
```
log     : { id:'l'+ts+'_'+rand, k:MOMENTS.k, ts:epoch_ms, memo:string, lat?:num, lng?:num }
child   : { id:'c'+seq, name:string, birth:'YYYY-MM' }
MOMENTS : [{k,e(emoji),n(名称),cls}] ×6 ／ MOMENT_MAP: k→定義 の辞書
```

## 実装位置（コードへのポインタ）
| ユニット | 03_implementation/index.html 内の関数/ブロック |
|----------|------------------------------|
| MOMENTS / MOMENT_MAP | `const MOMENTS = [...]` |
| recordMoment | `function recordMoment(k)` |
| renderLog / logTime / dayLabel | `function renderLog()` ほか |
| ageStr / renderKids / #kidAdd | `function ageStr(...)` ほか |
| migration | 読み込み直後の `db.trips.forEach(...)` |
