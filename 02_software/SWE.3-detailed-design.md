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

## SWD-renderRecap（RecordView, Stop 2）
割当：SWR-REC-01, 02, 03
```
renderRecap():
  tr ← T(); if 無し: 空表示; return
  items ← []
  schedule各予定 → items.push({dt:evtDate, kind:'plan', ...})   # 予定
  logs各記録   → items.push({dt:new Date(ts), kind:'rec', ...}) # 実績
  items を dt 昇順に整列（予定と実績が混ざる）
  ヘッダに 予定数/きろく数/写真数/イベント集計 を表示
  各行に kind に応じ「予定/記録」タグを付与（recは強調）
```
**設計意図**：予定と実績を同一時間軸で見せ、「しおり→記録」への変化を1画面で表現。

## SWD-renderAtlas / prefCounts / showCapsule（AtlasView, Stop 2）
割当：SWR-PREF-01〜04
```
prefCounts():  db.trips を走査し {pref: 回数} を返す（pref空は除外）
renderAtlas():
  counts ← prefCounts(); visited ← counts のキー数; total ← 47
  リング: 円周に対し visited/total の弧長で stroke-dashoffset を計算（SVG）
  選択中tripの pref を <select> で変更可 → 変更時 persist + renderAtlas + renderRecap
  REGIONS(地方) ごとに PREFS を chip 描画。回数 n で濃淡 v1(1)/v2(2)/v3(≥3)
  chip タップ → showCapsule(pref)
showCapsule(pref):
  その pref の trips を開始日順に一覧（各trip: 絵文字/日付/写真数/イベント集計）
  「開く」で db.active ← trip.id → renderAll → go('recap')
```
**設計意図**：座標ジオコーディング無しで「日本地図に積み重なる」体験を自己完結で実現（ADR参照）。

## SWD-story（StoryService, Stop 3）
割当：SWR-STORY-01〜06 / SWR-WORKER-01
```
buildStoryPayload(tr):                # 最小化（SWR-STORY-02）
  moments ← logのk別件数
  timeline ← schedule(予定) + logs(実績:時刻,種別名,memo) を時刻順
  return { trip:{name,type,pref,dest,start,end},
           children:[{nick:name, age:ageStr(birth)}],   # ニックネーム+年齢のみ
           moments, timeline }
  ※ lat/lng・写真・本名は構築に含めない（意図的除外）

generateStory():                      # 非同期
  if !db.storyUrl: 同意/設定導線を出す; return         # SWR-STORY-05
  storyLoading=true → renderStory（「つむいでいます…」）
  POST db.storyUrl (JSON=buildStoryPayload)
  ok && data.story → tr.story={text,ts}; persist        # SWR-STORY-04
  失敗 → toast（既存storyと他機能は保持）                # SWR-STORY-06
  finally storyLoading=false → renderStory

renderStory():
  URL未設定 → 設定入力(setrow)+手順案内
  URL有り   → 同意文 + 「物語を作る/作り直す」ボタン
  tr.story有り → 物語本文と生成日時を表示
```
Worker側（`worker/story-worker.js`）：OPTIONSでCORSプリフライト応答、POSTで
`buildPrompt(payload)`→Gemini `generateContent` 呼び出し→`{story}` を返す。
キーは env.GEMINI_API_KEY（secret）。**プロンプトはWorker側で組む**（改良時にフロント再デプロイ不要）。

## SWD-letter / SWD-insights（Stop 4）
割当：SWR-LETTER-*, SWR-HP-01, SWR-LEARN-01, SWR-OPEN-01, SWR-WORKER-02
```
Worker汎用化:  prompt ← payload.prompt があればそれ、無ければ buildPrompt(payload)
             → 物語も手紙も同じWorkerで動く（新AI機能でWorker再デプロイ不要）

buildLetterPrompt(tr, child):  子の呼び名＋当時年齢＋ tripFactsText(tr) から手紙指示を組む
generateLetter(childId):       POST {prompt} → tr.letters[childId]={text,ts} 保存・再表示

tripHP(tr):        effort = fuss*3 + hold*2 + diaper + milk + nap*0.5
                   がんばり度 = min(100, round(effort*9))。件数に応じ労いメッセージ
learnInsights():   全trips.logs を集約（3件未満はnull）
                   ・グズり最多時間帯
                   ・各tripの「最初の記録→初グズり」経過分の平均 avgGapMin
renderHomeInsights(): 上記＋「休憩の目安 = avgGap-15分」をホームカードに提示
openingSuggestion(counts): 地方別訪問数から最多地方＋未訪問地方を提案
```

## データ構造（詳細）
```
trip 追加 : pref:string, story?:{text,ts}, letters?:{ [childId]:{text,ts} }（Stop4）
（旧記載）  pref:string（''=未設定, 例 '神奈川県'）, story?:{text:string, ts:epoch_ms}（Stop3）
db 追加   : storyUrl:string（AI中継WorkerのURL, ''=未設定）（Stop3）
log      : { id:'l'+ts+'_'+rand, k:MOMENTS.k, ts:epoch_ms, memo:string, lat?:num, lng?:num }
child    : { id:'c'+seq, name:string, birth:'YYYY-MM' }
REGIONS  : [{n:地方名, p:[都道府県…]}] ×8 ／ PREFS: 47件のフラット配列
```

## 実装位置（コードへのポインタ）
| ユニット | 03_implementation/index.html 内の関数/ブロック |
|----------|------------------------------|
| MOMENTS / MOMENT_MAP / REGIONS / PREFS | 各 `const …` |
| recordMoment | `function recordMoment(k)` |
| renderLog / logTime / dayLabel | `function renderLog()` ほか |
| ageStr / renderKids / #kidAdd | `function ageStr(...)` ほか |
| renderRecap（ふりかえり） | `function renderRecap()` |
| renderAtlas / prefCounts / showCapsule（ちず） | `function renderAtlas()` ほか |
| renderStory / buildStoryPayload / generateStory（物語） | `function renderStory()` ほか |
| StoryWorker（別デプロイ） | `03_implementation/worker/story-worker.js` |
| migration | 読み込み直後の `db.trips.forEach(...)`（logs/pref 補完）＋ `db.storyUrl` 補完 |
| Router 再集約 | `go(id)` 内 recap/atlas の再render |
