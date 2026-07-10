/*
 * SWE.6 適格性確認テスト — 子どもへの手紙 ＋ Stop 4（学習・提案）
 * 対応: QTC-LETTER-01/02, QTC-HP-01, QTC-LEARN-01, QTC-OPEN-01, QTC-REG-04
 * 手紙のWorker応答はモック。学習系はAI不要（クライアント計算）。
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
await page.addInitScript(() => { window.print = () => { window.__printed = true; }; });
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push('CONSOLE:' + m.text()); });

let lastPrompt = null;
await ctx.route(MOCK, route => {
  try { lastPrompt = JSON.parse(route.request().postData() || '{}').prompt; } catch {}
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ story: '長女へ。あの日きみは流れるプールで笑っていたね。', model: 'mock' }) });
});

await page.goto(APP); await page.waitForTimeout(300);

// お子さん登録＋きろく
await page.click('.tab[data-page="log"]'); await page.waitForTimeout(120);
await page.fill('#kidName', '長女'); await page.fill('#kidBirth', '2021-05'); await page.click('#kidAdd'); await page.waitForTimeout(150);
for (const k of ['hold', 'hold', 'fuss', 'fuss', 'spot']) { await page.click('.mbtn[data-k="' + k + '"]'); await page.waitForTimeout(70); }
await page.evaluate((u) => { const d = JSON.parse(localStorage.getItem('odekake_v1')); d.storyUrl = u; localStorage.setItem('odekake_v1', JSON.stringify(d)); }, MOCK);
await page.reload(); await page.waitForTimeout(300);

// QTC-HP-01: 親HP（がんばりメーター）表示
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(200);
check('QTC-HP-01', (await page.$$('.hpcard')).length === 1, 'がんばりメーター表示');

// QTC-LETTER-01: お子さんへの手紙を生成
await (await page.$('[data-letter]')).click(); await page.waitForTimeout(300);
const letter = await page.textContent('.lettertext').catch(() => '');
check('QTC-LETTER-01', /流れるプール/.test(letter) && /への手紙/.test(lastPrompt || ''), '手紙生成＆手紙プロンプト送信');

// QTC-LETTER-02: 手紙が保存されリロード後も残る
await page.reload(); await page.waitForTimeout(300);
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(200);
check('QTC-LETTER-02', /流れるプール/.test(await page.textContent('.lettertext').catch(() => '')), 'reload後も保持');

// QTC-LEARN-01: ホームに家族のまなび
await page.click('.tab[data-page="home"]'); await page.waitForTimeout(200);
check('QTC-LEARN-01', (await page.$$('.learncard')).length === 1, '家族のまなび表示');

// QTC-OPEN-01: ちずに新規開拓提案
await page.click('.tab[data-page="atlas"]'); await page.waitForTimeout(200);
check('QTC-OPEN-01', (await page.$$('.opensug')).length === 1, '開拓提案表示');

// QTC-BOOK-01: 冊子（PDF）が生成され印刷が呼ばれる
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(150);
await page.click('#makeBooklet'); await page.waitForTimeout(400);
const book = await page.evaluate(() => { const r = document.getElementById('bookletRoot'); return { cover: !!r.querySelector('.bk-cover'), letter: /への手紙|へ$/.test(r.textContent) || /長女へ/.test(r.textContent), printed: !!window.__printed }; });
check('QTC-BOOK-01', book.cover && book.printed, '冊子DOM生成＆print呼出');

// QTC-REG-04: 物語（既存AI機能）に回帰なし
await page.click('.tab[data-page="recap"]'); await page.waitForTimeout(150);
await page.click('#genStory'); await page.waitForTimeout(300);
check('QTC-REG-04', /流れるプール/.test(await page.textContent('.storytext').catch(() => '')), '物語も生成できる');

check('QTC-NO-JSERR', jsErrors.length === 0, jsErrors.join(' | ') || 'JSエラー無し');

await browser.close();
const failed = results.filter(r => !r.pass);
console.log('\n' + (failed.length ? '❌ FAIL ' + failed.length + '件' : '✅ 全' + results.length + '件 Pass'));
process.exit(failed.length ? 1 : 0);
