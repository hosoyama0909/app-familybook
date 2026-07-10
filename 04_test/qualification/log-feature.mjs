/*
 * SWE.6 適格性確認テスト — きろく機能（Stop 1）
 * 対応: QTC-LOG-01/02/03, QTC-CHILD-01, QTC-DATA-01, QTC-REG-01
 * 実行: 04_test/README.md 参照
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const APP = 'file://' + resolve(__dir, '../../03_implementation/index.html');
const EXE = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const results = [];
function check(id, cond, detail) {
  results.push({ id, pass: !!cond, detail });
  console.log((cond ? '✅' : '❌') + ' ' + id + (detail ? '  ' + detail : ''));
}

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.goto(APP);
await page.waitForTimeout(300);

// QTC-LOG-01: 記録とサマリー
await page.click('.tab[data-page="log"]');
await page.waitForTimeout(150);
check('QTC-LOG-01a', await page.isVisible('#log') && (await page.$$('#moments .mbtn')).length === 6, '6ボタン表示');
// メモは「押す前に入れた分」が、その直後の押下に添付される（SWR-LOG-04）
await page.fill('#lgMemo', 'おなかすいた');
await page.click('.mbtn[data-k="fuss"]'); await page.waitForTimeout(120); // ← memoはこの記録へ
await page.click('.mbtn[data-k="milk"]'); await page.waitForTimeout(120); // ← memoなし
const summary = await page.textContent('#lgsummary');
const rows = (await page.$$('#lglist .logc')).length;
check('QTC-LOG-01b', /😭/.test(summary) && /🍼/.test(summary) && rows === 2, 'summary=' + summary.replace(/\s+/g, ''));

const stored = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('odekake_v1'));
  const t = d.trips.find(x => x.id === d.active);
  return {
    logs: t.logs.length,
    fussMemo: t.logs.find(l => l.k === 'fuss').memo,
    milkMemo: t.logs.find(l => l.k === 'milk').memo,
    inputCleared: null,
    anyGeo: t.logs.some(l => l.lat != null)
  };
});
const memoInput = await page.inputValue('#lgMemo');
// QTC-LOG-03: 直後の押下(fuss)に添付され、入力欄はクリア、次(milk)には付かない
check('QTC-LOG-03', stored.fussMemo === 'おなかすいた' && stored.milkMemo === '' && memoInput === '',
  'fuss="' + stored.fussMemo + '" milk="' + stored.milkMemo + '" input="' + memoInput + '"');
// QTC-LOG-02: 位置を付与しなくても記録は成立する
check('QTC-LOG-02', stored.logs === 2, '位置未付与でも記録2件 (geo=' + stored.anyGeo + ')');

// QTC-EDIT-01: 記録の時刻をあとから変更できる（押せなかった時用）
await page.fill('.ltedit', '07:05'); await page.dispatchEvent('.ltedit', 'change'); await page.waitForTimeout(150);
const editedHM = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); const t = d.trips.find(x => x.id === d.active); const dt = new Date(t.logs.find(l => l.k === 'milk').ts); return dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0'); });
check('QTC-EDIT-01', editedHM === '7:05', 'ミルクの時刻変更 → ' + editedHM);

// QTC-CHILD-01: 年齢自動計算（基準は実行時の当月。2021-05を登録し形式を確認）
await page.fill('#kidName', '長女');
await page.fill('#kidBirth', '2021-05');
await page.click('#kidAdd');
await page.waitForTimeout(150);
const kid = await page.textContent('#kidlist');
check('QTC-CHILD-01', /\d+歳\d+ヶ月/.test(kid), kid.replace(/\s+/g, ' ').trim());

// QTC-DATA-01: リロード保持
await page.reload(); await page.waitForTimeout(300);
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(150);
check('QTC-DATA-01', (await page.$$('#lglist .logc')).length === 2, 'reload後も2件');

// QTC-REG-01: 既存スケジュール回帰
await page.click('.tab[data-page="sched"]'); await page.waitForTimeout(150);
check('QTC-REG-01', (await page.$$('#evlist .li')).length > 0, '既存予定が描画');

// QTC-WHO-01: だれの記録か（任意）を付けて記録できる
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(150);
await page.selectOption('#lgChild', { label: '長女' });
await page.click('.mbtn[data-k="hold"]'); await page.waitForTimeout(150);
const who = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); const t = d.trips.find(x => x.id === d.active); const l = t.logs.find(x => x.k === 'hold'); return (d.children.find(c => c.id === l.childId) || {}).name; });
check('QTC-WHO-01', who === '長女', 'だれの記録か=' + who);
// QTC-MEMO-01: メモをあとから編集できる（先頭=最新=hold）
await page.locator('.lmemoedit').first().fill('抱っこで即寝');
await page.locator('.lmemoedit').first().dispatchEvent('change'); await page.waitForTimeout(120);
const memoEdited = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); const t = d.trips.find(x => x.id === d.active); return t.logs.find(x => x.k === 'hold').memo; });
check('QTC-MEMO-01', memoEdited === '抱っこで即寝', 'メモ後編集=' + memoEdited);
// QTC-WHO-02: 「未指定（なし）」に戻せる
await page.locator('.lchild').first().selectOption(''); await page.waitForTimeout(120);
const cleared = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); const t = d.trips.find(x => x.id === d.active); return t.logs.find(x => x.k === 'hold').childId; });
check('QTC-WHO-02', cleared === '', '未指定に戻せる (childId="' + cleared + '")');

check('QTC-NO-ERRORS', errors.length === 0, errors.join(' | ') || 'コンソールエラー無し');

await browser.close();
const failed = results.filter(r => !r.pass);
console.log('\n' + (failed.length ? '❌ FAIL ' + failed.length + '件' : '✅ 全' + results.length + '件 Pass'));
process.exit(failed.length ? 1 : 0);
