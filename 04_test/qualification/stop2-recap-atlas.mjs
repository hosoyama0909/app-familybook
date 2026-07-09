/*
 * SWE.6 適格性確認テスト — Stop 2（ふりかえり / 都道府県ヒストリー）
 * 対応: QTC-REC-01/02, QTC-PREF-01/02/03, QTC-REG-02
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

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
await page.goto(APP);
await page.waitForTimeout(300);

// 記録を2件作る（実績）
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(150);
await page.click('.mbtn[data-k="fuss"]'); await page.waitForTimeout(100);
await page.click('.mbtn[data-k="spot"]'); await page.waitForTimeout(100);

// QTC-REC-01: ふりかえりが 予定(12) + 実績(2) を時系列統合表示
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(200);
const allRows = (await page.$$('.tlrow')).length;
const recRows = (await page.$$('.tlrow.act')).length;
const planTags = (await page.$$('.tag2.plan')).length;
check('QTC-REC-01', allRows === 14 && recRows === 2 && planTags === 12, `rows=${allRows} rec=${recRows} plan=${planTags}`);

// QTC-REC-02: 集計統計が出る（きろく件数=2）
const stats = await page.textContent('.recaphead .rstats');
check('QTC-REC-02', /2/.test(stats), 'stats表示あり');

// QTC-PREF-01: 初期は seed(神奈川県) で 1/47・神奈川が色付き
await page.click('.tab[data-page="atlas"]'); await page.waitForTimeout(200);
const ring1 = (await page.textContent('.ring .rc')).replace(/\s+/g, '');
const knCls = await page.getAttribute('.pchip[data-pref="神奈川県"]', 'class');
check('QTC-PREF-01', ring1.startsWith('1/47') && /v1|v2|v3/.test(knCls), `${ring1} ${knCls}`);

// QTC-PREF-02: タイムカプセル — 神奈川タップで箱根が出て、開くとふりかえりへ
await page.click('.pchip[data-pref="神奈川県"]'); await page.waitForTimeout(150);
const capsule = await page.textContent('#capsuleslot');
await page.click('#capsuleslot [data-open]'); await page.waitForTimeout(150);
const jumped = await page.isVisible('#recap');
check('QTC-PREF-02', /箱根/.test(capsule) && jumped, `capsule=${/箱根/.test(capsule)} jumped=${jumped}`);

// QTC-PREF-03: 都道府県の変更が集計・保存に反映
await page.click('.tab[data-page="atlas"]'); await page.waitForTimeout(150);
await page.selectOption('#prefSel', '東京都'); await page.waitForTimeout(150);
const tkCls = await page.getAttribute('.pchip[data-pref="東京都"]', 'class');
const savedPref = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); return d.trips.find(t => t.id === d.active).pref; });
check('QTC-PREF-03', /v1|v2|v3/.test(tkCls) && savedPref === '東京都', `cls=${tkCls} saved=${savedPref}`);

// QTC-REG-02: 既存機能（スケジュール）に回帰なし
await page.click('.tab[data-page="sched"]'); await page.waitForTimeout(150);
check('QTC-REG-02', (await page.$$('#evlist .li')).length > 0, '既存予定が描画');

check('QTC-NO-ERRORS', errors.length === 0, errors.join(' | ') || 'エラー無し');

await browser.close();
const failed = results.filter(r => !r.pass);
console.log('\n' + (failed.length ? '❌ FAIL ' + failed.length + '件' : '✅ 全' + results.length + '件 Pass'));
process.exit(failed.length ? 1 : 0);
