/*
 * SWE.6 適格性確認テスト — UI改善バッチ（Undo・予定編集・日付変更・持ち物カウント）
 * 対応: QTC-UNDO-01/02, QTC-EVEDIT-01/02, QTC-DATE-01, QTC-PACKCNT-01
 * 実行: 04_test/README.md 参照
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const APP = 'file://' + resolve(__dir, '../../03_implementation/index.html');
const EXE = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const results = [];
const check = (id, cond, detail) => { results.push({ id, pass: !!cond }); console.log((cond ? '✅' : '❌') + ' ' + id + (detail ? '  ' + detail : '')); };
const getDb = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('odekake_v1')));

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push('CONSOLE:' + m.text()); });
await page.goto(APP); await page.waitForTimeout(300);

// QTC-DATE-01: きろくの「日付」をあとから変更 → 日付グループも移動
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(150);
await page.click('.mbtn[data-k="fuss"]'); await page.waitForTimeout(150);
await page.fill('.ltedit', '2026-07-01T08:30'); await page.dispatchEvent('.ltedit', 'change'); await page.waitForTimeout(200);
const d1 = await getDb(page);
const movedTs = new Date(d1.trips.find(x => x.id === d1.active).logs[0].ts);
const grouped = await page.evaluate(() => document.getElementById('lglist').textContent.includes('7/1'));
check('QTC-DATE-01', movedTs.getMonth() + 1 === 7 && movedTs.getDate() === 1 && grouped, '7/1へ移動＆日付グループ表示');

// QTC-UNDO-01: きろく削除 → トーストの「元に戻す」で復元
await page.click('#lglist .xdel'); await page.waitForTimeout(150);
const undoVisible = await page.isVisible('#toastUndo');
await page.click('#toastUndo'); await page.waitForTimeout(250);
const d2 = await getDb(page);
check('QTC-UNDO-01', undoVisible && d2.trips.find(x => x.id === d2.active).logs.length === 1, '削除→Undoで復元');

// QTC-EVEDIT-01: 予定行タップ→フォーム読込→更新
await page.click('.tab[data-page="sched"]'); await page.waitForTimeout(200);
await page.click('#evlist .evtap'); await page.waitForTimeout(150);
const loaded = await page.inputValue('#evTitle');
await page.fill('#evTitle', loaded + '（修正）');
await page.click('#evAdd'); await page.waitForTimeout(200);
const d3 = await getDb(page);
const edited = d3.trips.find(x => x.id === d3.active).schedule.some(e => e.title.endsWith('（修正）'));
const btnReset = (await page.textContent('#evAdd')).includes('追加');
check('QTC-EVEDIT-01', loaded.length > 0 && edited && btnReset, '編集読込→更新→フォーム復帰');

// QTC-UNDO-02: 予定の更新もUndoで戻せる
await page.click('#toastUndo'); await page.waitForTimeout(250);
const d4 = await getDb(page);
check('QTC-UNDO-02', !d4.trips.find(x => x.id === d4.active).schedule.some(e => e.title.endsWith('（修正）')), '予定更新のUndo');

// QTC-EVEDIT-02: キャンセルで編集モード解除
await page.click('.tab[data-page="sched"]'); await page.waitForTimeout(150);
await page.click('#evlist .evtap'); await page.waitForTimeout(120);
await page.click('#evCancel'); await page.waitForTimeout(120);
check('QTC-EVEDIT-02', (await page.textContent('#evAdd')).includes('追加') && !(await page.isVisible('#evCancel')), 'キャンセル動作');

// QTC-PACKCNT-01: 持ち物カウント表示
await page.click('.tab[data-page="pack"]'); await page.waitForTimeout(200);
await page.click('#pklist input[type=checkbox]'); await page.waitForTimeout(150);
const cnt = await page.textContent('#pkcount');
check('QTC-PACKCNT-01', /1 \/ \d+ そろった/.test(cnt), cnt.trim());

check('QTC-NO-JSERR', jsErrors.length === 0, jsErrors.join(' | ') || 'JSエラー無し');

await browser.close();
const failed = results.filter(r => !r.pass);
console.log('\n' + (failed.length ? '❌ FAIL ' + failed.length + '件' : '✅ 全' + results.length + '件 Pass'));
process.exit(failed.length ? 1 : 0);
