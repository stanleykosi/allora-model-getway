#!/usr/bin/env node
/*
 Scan topic IDs in a range and list those effectively active now.
 Criteria:
  - is_topic_active(id) === true
  - Within current worker submission window derived from topics/{id}
  - Has at least one unfulfilled worker nonce

 Usage: node scripts/list-active-topics-by-ids.js [API_BASE] [START_ID] [END_ID]
   API_BASE default: https://allora-testnet-api.polkachu.com
   START_ID default: 1
   END_ID default: 100
*/
const axios = require('axios');

async function fetchJson(url) {
  const res = await axios.get(url, { timeout: 10000 });
  return res.data;
}

function inWindow(current, start, end) {
  return Number(current) >= Number(start) && Number(current) <= Number(end);
}

async function checkTopic(api, id, currentHeight) {
  const out = { topicId: String(id), ok: false };
  try {
    const [details, activeRes] = await Promise.all([
      fetchJson(`${api}/emissions/v9/topics/${id}`),
      fetchJson(`${api}/emissions/v9/is_topic_active/${id}`),
    ]);

    const topic = details?.topic || {};
    const isActive = Boolean(activeRes?.is_active ?? activeRes?.active);
    const epochLastEnded = parseInt(topic.epoch_last_ended || '0', 10);
    const workerWindow = parseInt(topic.worker_submission_window || '0', 10);
    const start = epochLastEnded + 1;
    const end = epochLastEnded + workerWindow;
    const currentInWindow = inWindow(currentHeight, start, end);

    let openNonce = null;
    try {
      const nonces = await fetchJson(`${api}/emissions/v9/unfulfilled_worker_nonces/${id}`);
      openNonce = nonces?.nonces?.nonces?.[0]?.block_height || null;
    } catch (_) { }

    const hasOpenNonce = !!openNonce;
    const eligible = isActive && currentInWindow && hasOpenNonce;

    Object.assign(out, {
      isActive,
      epochLastEnded,
      workerSubmissionWindow: workerWindow,
      window: { start, end },
      currentInWindow,
      openNonce: openNonce ? Number(openNonce) : null,
      eligible,
      metadata: topic.metadata,
      creator: topic.creator,
    });
    out.ok = true;
  } catch (e) {
    out.error = e?.response?.status ? `HTTP ${e.response.status}` : (e?.message || String(e));
  }
  return out;
}

async function main() {
  const api = process.argv[2] || 'https://allora-testnet-api.polkachu.com';
  const startId = Number(process.argv[3] || 1);
  const endId = Number(process.argv[4] || 100);
  const concurrency = 5;

  const latest = await fetchJson(`${api}/cosmos/base/tendermint/v1beta1/blocks/latest`);
  const h = parseInt(latest?.block?.header?.height, 10);
  const t = latest?.block?.header?.time;
  console.log(JSON.stringify({ latest: { height: h, time: t }, range: { startId, endId } }));

  const ids = Array.from({ length: endId - startId + 1 }, (_, i) => startId + i);
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < ids.length) {
      const current = idx++;
      const id = ids[current];
      const r = await checkTopic(api, id, h);
      if (r.ok) results.push(r);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const eligible = results.filter((r) => r.eligible);
  const activeNow = results.filter((r) => r.isActive);
  console.log(JSON.stringify({
    scannedCount: results.length,
    activeNow: activeNow.map(({ topicId, metadata, creator }) => ({ topicId, metadata, creator })),
    eligibleNow: eligible.map(({ topicId, metadata, creator, window, openNonce }) => ({ topicId, metadata, creator, window, openNonce })),
  }, null, 2));
}

main().catch((e) => {
  console.error('Error:', e?.message || e);
  process.exit(1);
});


