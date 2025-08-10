import 'dotenv/config';
import logger from '@/utils/logger';
import { config } from '@/config';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';

async function main() {
  const log = logger.child({ script: 'register-all-topics' });
  const start = Number(process.env.START_ID || config.ACTIVE_TOPICS_SCAN_START_ID);
  const end = Number(process.env.END_ID || config.ACTIVE_TOPICS_SCAN_END_ID);

  const workerMnemonic = String(process.env.WORKER_MNEMONIC || '');
  if (!workerMnemonic) {
    log.error('WORKER_MNEMONIC env var is required for register-all-topics script');
    process.exitCode = 1;
    return;
  }

  let success = 0;
  let already = 0;
  let failed = 0;

  // Fetch the current active topics from the chain once, then register those within [start, end]
  const activeList = await alloraConnectorService.getActiveTopics();
  const activeIds = (activeList.topics || [])
    .map((t: { id: string }) => Number(t.id))
    .filter((n: number) => Number.isFinite(n) && n >= start && n <= end);

  log.info({ start, end, activeCount: activeIds.length }, 'Active topics discovered in range');

  for (const id of activeIds) {
    try {
      const res = await alloraConnectorService.registerWorkerOnChain(workerMnemonic, String(id));
      if (res?.txHash === 'ALREADY_REGISTERED') {
        already++;
        log.info({ id }, 'Already registered');
      } else if (res?.txHash) {
        success++;
        log.info({ id, txHash: res.txHash }, 'Registered');
      } else {
        failed++;
        log.warn({ id }, 'Registration returned null');
      }
    } catch (e) {
      failed++;
      log.warn({ id, err: e }, 'Registration error');
    }
  }

  log.info({ start, end, success, already, failed }, 'Done registering topics');
}

main().catch((err) => {
  console.error('register-all-topics failed:', err?.message || err);
  logger.error({ err }, 'register-all-topics failed');
  process.exitCode = 1;
});


