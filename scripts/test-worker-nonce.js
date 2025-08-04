#!/usr/bin/env node
/*
Usage:
  node scripts/test-worker-nonce.js <topicId> <workerAddress>
Prints current block, topic info, derived latest open worker nonce, unfulfilled check, and canSubmitWorker result.
*/

(async () => {
  try {
    const [,, topicId, workerAddress] = process.argv;
    if (!topicId || !workerAddress) {
      console.error('Usage: node scripts/test-worker-nonce.js <topicId> <workerAddress>');
      process.exit(1);
    }

    // Load after build
    let svc;
    try {
      svc = require('../dist/core/allora-connector/allora-connector.service.js').default;
    } catch (e) {
      console.error('Failed to load built connector service. Build the project first (npm run build).');
      process.exit(1);
    }

    const current = await svc.getCurrentBlockHeight();
    console.log('currentBlockHeight =', current);

    const info = await svc.getTopicInfo(String(topicId));
    console.log('topicInfo =', info);

    const derived = await svc.deriveLatestOpenWorkerNonce(String(topicId));
    console.log('derivedLatestOpenWorkerNonce =', derived);

    if (derived != null) {
      const unfilled = await svc.isWorkerNonceUnfulfilled(String(topicId), Number(derived));
      console.log('isWorkerNonceUnfulfilled(derived) =', unfilled);
    }

    const can = await svc.canSubmitWorker(String(topicId), String(workerAddress));
    console.log('canSubmitWorker =', can);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
