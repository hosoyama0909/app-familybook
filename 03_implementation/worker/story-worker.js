/*
 * おでかけ手帳 — 物語生成 Worker（Cloudflare Workers）
 * SWE.3 実装: フロントから最小化したおでかけデータを受け取り、Gemini API（無料枠）で
 *   家族の物語文を生成して返す。キー(GEMINI_API_KEY)は Worker の secret に保持する。
 *
 * モデル選定メモ（2026-07 時点・無料枠で検証した結果）:
 *   - gemini-flash-lite-latest … ✅ 無料枠で安定動作（本番の既定）
 *   - gemini-flash-latest       … 動くが 503(混雑) が出やすい
 *   - gemini-2.0-flash          … 無料枠 limit:0（使えない）
 *   - gemini-2.5-flash          … 新規ユーザーには提供終了(404)
 *   → 既定は gemini-flash-lite-latest。混雑/失敗時は下記 FALLBACK へ自動切替＋503は再試行。
 *
 * 環境変数:
 *   GEMINI_API_KEY … secret（必須）
 *   ALLOW_ORIGIN   … var（推奨: 自分のPages URL。例 https://hosoyama0909.github.io）既定 "*"
 *   GEMINI_MODEL   … var（既定 gemini-flash-lite-latest）
 */

const FALLBACK = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.0-flash-001'];

function cors(o) {
  return { 'Access-Control-Allow-Origin': o || '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
}
const json = (obj, status, o) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(o) } });

function buildPrompt(p) {
  const t = p.trip || {};
  const kids = (p.children || []).map(c => `${c.nick || '子ども'}（${c.age || '年齢不明'}）`).join('、');
  const M = { fuss: 'グズり', hold: '抱っこ', milk: 'ミルク', diaper: 'おむつ', nap: 'ねんね', spot: '神スポット' };
  const moments = Object.entries(p.moments || {}).filter(([, n]) => n > 0).map(([k, n]) => `${M[k] || k}×${n}`).join('、') || 'なし';
  const timeline = (p.timeline || []).slice(0, 40).map(it =>
    `${it.t || ''} [${it.kind === 'rec' ? '実際の出来事' : '予定'}] ${it.title || ''}${it.note ? '（' + it.note + '）' : ''}`).join('\n');
  return [
    'あなたは家族の思い出を綴る、あたたかく少しユーモアのある書き手です。',
    '以下のおでかけの記録をもとに、親の目線で200〜320字の日本語の物語文（日記）を書いてください。',
    '・実際に起きた出来事（グズり・抱っこ・神スポット等）を拾い、情景と感情を込める',
    '・箇条書きにせず、地の文で。絵文字や見出しは使わない',
    '・子どもの呼び名があれば自然に登場させる',
    '',
    `【おでかけ】${t.name || '家族のおでかけ'}（${t.pref || ''}${t.dest ? '・' + t.dest : ''}）${t.start || ''}〜${t.end || ''}`,
    kids ? `【子ども】${kids}` : '',
    `【できごと集計】${moments}`,
    '【予定と記録】',
    timeline || '（記録なし）',
  ].filter(Boolean).join('\n');
}

async function callGemini(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 700 } };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'GET') return json({ ok: true, message: 'おでかけ手帳 物語Worker 稼働中。POSTで生成します。' }, 200, origin);
    if (request.method !== 'POST') return json({ error: 'POSTのみ対応' }, 405, origin);
    if (!env.GEMINI_API_KEY) return json({ error: 'サーバにGEMINI_API_KEYが未設定です' }, 500, origin);

    let payload;
    try { payload = await request.json(); } catch { return json({ error: '不正なJSON' }, 400, origin); }
    const prompt = buildPrompt(payload);

    // 既定モデル → フォールバックの順に試す。503/500は同モデルで1回再試行、他は次モデルへ。
    const models = [env.GEMINI_MODEL || 'gemini-flash-lite-latest', ...FALLBACK].filter((v, i, a) => v && a.indexOf(v) === i);
    let last = '未実行';
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        let res;
        try { res = await callGemini(model, env.GEMINI_API_KEY, prompt); }
        catch (e) { last = '接続失敗: ' + model; break; }
        if (res.ok) {
          const story = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (story) return json({ story, model }, 200, origin);
          last = '空応答: ' + model; break;
        }
        last = model + ': ' + (res.data?.error?.message || res.status);
        if (res.status === 503 || res.status === 500) { await new Promise(r => setTimeout(r, 1500)); continue; }
        break; // 404 / 429(limit:0) など → 次のモデルへ
      }
    }
    return json({ error: 'Gemini APIエラー', detail: last }, 502, origin);
  },
};
