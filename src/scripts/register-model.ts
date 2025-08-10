import 'dotenv/config';
import logger from '@/utils/logger';
import { config } from '@/config';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';

async function main() {
  const log = logger.child({ script: 'register-model' });
  const topicIdEnv = process.env.TOPIC_ID ? String(process.env.TOPIC_ID) : undefined;

  const workerMnemonic = String(process.env.WORKER_MNEMONIC || '');
  if (!workerMnemonic) {
    log.error('WORKER_MNEMONIC env var is required for register-model script');
    process.exitCode = 1;
    return;
  }

  // Decide topicId: use env override if provided; else find an active topic by scanning configured range
  let topicId: string | null = null;
  if (topicIdEnv) {
    topicId = topicIdEnv;
    log.info({ topicId }, 'Using TOPIC_ID from env');
  } else {
    for (let id = config.ACTIVE_TOPICS_SCAN_START_ID; id <= config.ACTIVE_TOPICS_SCAN_END_ID; id++) {
      try {
        const t = await alloraConnectorService.getTopicDetails(String(id));
        if (t && t.isActive) {
          topicId = String(id);
          log.info({ topicId }, 'Discovered active topic for registration');
          break;
        }
      } catch (_e) { }
    }
  }

  if (!topicId) {
    log.error('No active topic found and no TOPIC_ID provided');
    process.exitCode = 1;
    return;
  }

  log.info({ topicId }, 'Attempting on-chain registration');
  const res = await alloraConnectorService.registerWorkerOnChain(workerMnemonic, topicId);
  if (!res) {
    log.error({ topicId }, 'Registration failed');
    process.exitCode = 1;
    return;
  }

  log.info({ txHash: res.txHash, topicId }, 'Registration succeeded');
}

main().catch((err) => {
  console.error('Registration script failed:', err?.message || err);
  logger.error({ err }, 'Registration script failed');
  process.exitCode = 1;
});


