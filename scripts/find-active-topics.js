#!/usr/bin/env node
/*
 Determine currently active topics using topic timing + is_topic_active + unfulfilled nonces.
 Usage: node scripts/find-active-topics.js [API_BASE] [topicIdsCSV]
   API_BASE default: https://allora-testnet-api.polkachu.com
   topicIdsCSV default: 1 (comma-separated list of topic IDs to check)
*/
const axios = require('axios');

async function fetchJson(url) {
  const res = await axios.get(url, { timeout: 10000 });
  return res.data;
}

function inWindow(current, start, end) {
  return Number(current) >= Number(start) && Number(current) <= Number(end);
}

async function main() {
  const api = process.argv[2] || 'https://allora-testnet-api.polkachu.com';
  const topicIds = (process.argv[3] || '1').split(',').map((s) => s.trim()).filter(Boolean);

  const latest = await fetchJson(`${api}/cosmos/base/tendermint/v1beta1/blocks/latest`);
  const h = parseInt(latest?.block?.header?.height, 10);
  const t = latest?.block?.header?.time;
  console.log(JSON.stringify({ latest: { height: h, time: t } }));

  const results = [];
  for (const id of topicIds) {
    try {
      const details = await fetchJson(`${api}/emissions/v9/topics/${id}`);
      const topic = details?.topic || {};
      const epochLastEnded = parseInt(topic.epoch_last_ended || '0', 10);
      const window = parseInt(topic.worker_submission_window || '0', 10);
      const start = epochLastEnded + 1;
      const end = epochLastEnded + window;

      const activeNow = await fetchJson(`${api}/emissions/v9/is_topic_active/${id}`);
      const isActive = Boolean(activeNow?.is_active ?? activeNow?.active);

      let openNonce = null;
      try {
        const nonces = await fetchJson(`${api}/emissions/v9/unfulfilled_worker_nonces/${id}`);
        openNonce = nonces?.nonces?.nonces?.[0]?.block_height || null;
      } catch (_) { }

      results.push({
        topicId: String(id),
        isActive,
        epochLastEnded,
        workerSubmissionWindow: window,
        window: { start, end },
        currentInWindow: inWindow(h, start, end),
        openNonce: openNonce ? Number(openNonce) : null,
      });
    } catch (e) {
      results.push({ topicId: String(id), error: e?.message || String(e) });
    }
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((e) => {
  console.error('Error:', e?.message || e);
  process.exit(1);
});


