/*
 * SWE.6 適格性確認テスト — Stop 3（AI物語・クライアント統合）
 * 対応: QTC-STORY-01/02/03/04, QTC-REG-03
 * Worker/Gemini本体は外部依存のため、Worker応答をモックしてフロント統合を検証する。
 * 実行: 04_test/README.md 参照
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const APP = 'file://' + resolve(__dir, '../../03_implementation/index.html');
const EXE = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MOCK = 'https://mock.worker.test/gen';

const results = [];
const check = (id, cond, detail) => { results.push({ id, pass: !!cond }); console.log((cond ? '✅' : '❌') + ' ' + id + (detail ? '  ' + detail : '')); };

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
// 意図的な502(ネットワーク)ログは除外し、真のJSエラーのみ拾う
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push('CONSOLE:' + m.text()); });

let posted = null;
await ctx.route(MOCK, route => {
  posted = route.request().postData();
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ story: '箱根の朝は霧に包まれていた。長女は流れるプールで歓声をあげ、私たちは家族の時間を積み重ねた。' }) });
});

await page.goto(APP); await page.waitForTimeout(300);

// きろくを1件（メモ付き）
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(120);
await page.fill('#lgMemo', '流れるプールで大興奮');
await page.click('.mbtn[data-k="spot"]'); await page.waitForTimeout(100);

// Worker URL を設定して反映
await page.evaluate((u) => { const d = JSON.parse(localStorage.getItem('odekake_v1')); d.storyUrl = u; localStorage.setItem('odekake_v1', JSON.stringify(d)); }, MOCK);
await page.reload(); await page.waitForTimeout(300);

// QTC-AWARD-01: あるある大賞（AI不要）がきろくから表示される
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(200);
const award = await page.textContent('.awardcard').catch(() => '');
check('QTC-AWARD-01', /大賞/.test(award) && /神スポット/.test(award), 'あるある大賞表示');

// QTC-STORY-01: 生成ボタン→物語が表示される
await page.waitForTimeout(50);
await page.click('#genStory'); await page.waitForTimeout(400);
const shown = await page.textContent('.storytext').catch(() => '');
check('QTC-STORY-01', /長女/.test(shown), '物語表示');

// QTC-STORY-02: 送信ペイロードにGPS座標・本名(lat/lng)が無く、メモは含む
check('QTC-STORY-02', posted && !/"lat"|"lng"/.test(posted) && /流れるプール/.test(posted), 'GPS無し・メモ有り');

// QTC-STORY-03: 生成結果が保存され、リロード後も残る
const saved = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('odekake_v1')); return !!(d.trips.find(t => t.id === d.active).story || {}).text; });
await page.reload(); await page.waitForTimeout(300);
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(200);
const afterReload = await page.textContent('.storytext').catch(() => '');
check('QTC-STORY-03', saved && /長女/.test(afterReload), 'reload後も保持');

// QTC-STORY-04: 生成失敗(502)でもクラッシュせず、前の物語は残る（劣化）
await ctx.unroute(MOCK);
await ctx.route(MOCK, r => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Gemini APIエラー' }) }));
await page.click('#genStory'); await page.waitForTimeout(400);
const kept = await page.textContent('.storytext').catch(() => '');
check('QTC-STORY-04', /長女/.test(kept), '失敗しても既存物語を保持');

// QTC-REG-03: 既存機能（スケジュール）に回帰なし
await page.click('.tab[data-page="sched"]'); await page.waitForTimeout(150);
check('QTC-REG-03', (await page.$$('#evlist .li')).length > 0, '既存予定が描画');

check('QTC-NO-JSERR', jsErrors.length === 0, jsErrors.join(' | ') || 'JSエラー無し（意図的な502は除外）');

await browser.close();
const failed = results.filter(r => !r.pass);
console.log('\n' + (failed.length ? '❌ FAIL ' + failed.length + '件' : '✅ 全' + results.length + '件 Pass'));
process.exit(failed.length ? 1 : 0);
