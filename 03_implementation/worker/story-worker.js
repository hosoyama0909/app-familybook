/*
 * おでかけ手帳 — 物語生成 Worker（Cloudflare Workers）
 * SWE.3 実装: フロントから最小化されたおでかけデータを受け取り、
 *   Gemini API（無料枠）で家族の物語文を生成して返す。
 * キー(GEMINI_API_KEY)は Worker の secret に保持し、クライアントには出さない。
 *
 * 環境変数:
 *   GEMINI_API_KEY … secret（必須）  wrangler secret put GEMINI_API_KEY
 *   ALLOW_ORIGIN   … var（推奨: 自分のPages URL。例 https://hosoyama0909.github.io）既定 "*"
 *   GEMINI_MODEL   … var（既定 gemini-2.0-flash）
 */

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
const json = (obj, status, origin) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

/* 最小化ペイロード → 日本語プロンプト（プロンプトはサーバ側で組む＝改良時に再デプロイ不要） */
function buildPrompt(p) {
  const t = p.trip || {};
  const kids = (p.children || []).map(c => `${c.nick || '子ども'}（${c.age || '年齢不明'}）`).join('、');
  const M = { fuss:'グズり', hold:'抱っこ', milk:'ミルク', diaper:'おむつ', nap:'ねんね', spot:'神スポット' };
  const moments = Object.entries(p.moments || {}).filter(([,n]) => n > 0)
    .map(([k, n]) => `${M[k] || k}×${n}`).join('、') || 'なし';
  const timeline = (p.timeline || []).slice(0, 40).map(it =>
    `${it.t || ''} [${it.kind === 'rec' ? '実際の出来事' : '予定'}] ${it.title || ''}${it.note ? '（' + it.note + '）' : ''}`
  ).join('\n');
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

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return json({ error: 'POSTのみ対応' }, 405, origin);
    if (!env.GEMINI_API_KEY) return json({ error: 'サーバにGEMINI_API_KEYが未設定です' }, 500, origin);

    let payload;
    try { payload = await request.json(); } catch { return json({ error: '不正なJSON' }, 400, origin); }

    const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 700 },
    };

    let data;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      data = await r.json();
      if (!r.ok) return json({ error: 'Gemini APIエラー', detail: data?.error?.message || r.status }, 502, origin);
    } catch (e) {
      return json({ error: 'Geminiへの接続に失敗しました' }, 502, origin);
    }

    const story = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!story) return json({ error: '物語を生成できませんでした（応答が空）' }, 502, origin);
    return json({ story }, 200, origin);
  },
};
