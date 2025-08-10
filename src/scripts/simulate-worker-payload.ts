import 'dotenv/config';
import { config } from '@/config';
import logger from '@/utils/logger';

import {
  SigningStargateClient,
  GasPrice,
  defaultRegistryTypes,
  calculateFee,
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry, EncodeObject } from '@cosmjs/proto-signing';
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { EnglishMnemonic, Bip39, Slip10, Slip10Curve, Slip10RawIndex } from '@cosmjs/crypto';

import {
  InputInference,
  InputInferenceForecastBundle,
  InputForecast,
  InputWorkerDataBundle,
  InsertWorkerPayloadRequest,
} from '@/generated/allora_worker';

import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import { formatToBoundedExp40Dec } from '@/core/allora-connector/bounded-exp40dec';

async function main() {
  const log = logger.child({ script: 'simulate-worker-payload' });

  const broadcast = /^true$/i.test(String(process.env.BROADCAST || 'false'));
  const skipRegister = /^true$/i.test(String(process.env.SKIP_REGISTER || 'false'));
  const fastBroadcast = /^true$/i.test(String(process.env.FAST_BROADCAST || 'false'));
  const skipCanSubmit = fastBroadcast || /^true$/i.test(String(process.env.SKIP_CAN_SUBMIT || 'false'));
  const topicIdOverride = process.env.TOPIC_ID ? String(process.env.TOPIC_ID) : undefined;
  log.info({ broadcast }, 'Starting simulation script');

  // Resolve worker mnemonic from environment
  const workerMnemonic = String(process.env.WORKER_MNEMONIC || '');
  if (!workerMnemonic) {
    logger.error('WORKER_MNEMONIC env var is required for simulate-worker-payload script');
    process.exitCode = 1;
    return;
  }

  // Derive address from mnemonic and proceed
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(workerMnemonic, { prefix: 'allo' });
  const [acct] = await wallet.getAccounts();
  const workerAddress = acct.address;
  log.info({ workerAddress }, 'Using worker wallet');

  // Scan topics for an active one with an open worker nonce and an allowance for this worker
  let chosen: { topicId: number; nonceHeight: number } | null = null;
  if (topicIdOverride) {
    logger.info({ topicIdOverride }, 'Using explicit TOPIC_ID override');
    const nonce = await alloraConnectorService.deriveLatestOpenWorkerNonce(topicIdOverride);
    if (nonce == null) {
      logger.error({ topicIdOverride }, 'Specified topic has no open worker nonce');
      process.exitCode = 1;
      return;
    }
    const allowed = await alloraConnectorService.canSubmitWorker(topicIdOverride, workerAddress);
    if (!allowed) {
      logger.error({ topicIdOverride }, 'Worker is not allowed to submit on specified topic');
      process.exitCode = 1;
      return;
    }
    chosen = { topicId: Number(topicIdOverride), nonceHeight: nonce };
  } else {
    for (let id = config.ACTIVE_TOPICS_SCAN_START_ID; id <= config.ACTIVE_TOPICS_SCAN_END_ID; id++) {
      logger.debug({ id }, 'Scanning topic id');
      const nonce = await alloraConnectorService.deriveLatestOpenWorkerNonce(String(id));
      if (nonce == null) continue;
      if (!skipCanSubmit) {
        const allowed = await alloraConnectorService.canSubmitWorker(String(id), workerAddress);
        if (!allowed) continue;
      }
      chosen = { topicId: id, nonceHeight: nonce };
      break;
    }
  }

  if (!chosen) {
    log.error('No eligible topic found with an open worker nonce for this worker');
    process.exitCode = 1;
    return;
  }
  log.info({ chosen }, 'Selected topic and nonce');

  // Ensure on-chain registration for the selected topic before attempting submission (optional)
  if (!skipRegister) {
    try {
      const reg = await alloraConnectorService.registerWorkerOnChain(workerMnemonic, String(chosen.topicId));
      if (reg) {
        logger.info({ txHash: reg.txHash, topicId: chosen.topicId }, 'Registration completed prior to submission');
      } else {
        logger.warn({ topicId: chosen.topicId }, 'Registration step returned null (may already be registered or transient issue). Proceeding to simulate.');
      }
    } catch (e) {
      logger.warn({ err: e, topicId: chosen.topicId }, 'Registration attempt errored. Proceeding to simulate regardless.');
    }
  } else {
    logger.info({ topicId: chosen.topicId }, 'Skipping registration per SKIP_REGISTER');
  }

  // Re-derive a fresh open nonce right before building/signing to avoid stale nonce
  // Submit immediately using the originally selected open nonce

  // Build inference-only payload like the service
  const inferenceValue = '0.123456789';
  const inference: InputInference = {
    topicId: chosen.topicId,
    blockHeight: chosen.nonceHeight,
    inferer: workerAddress,
    value: formatToBoundedExp40Dec(inferenceValue),
    extraData: new Uint8Array(0),
    proof: '',
  };

  const bundle: InputInferenceForecastBundle = {
    inference,
    forecast: undefined,
  };

  const bundleProto = InputInferenceForecastBundle.fromPartial(bundle);
  const messageBytes = InputInferenceForecastBundle.encode(bundleProto).finish();
  const messageHash = sha256(messageBytes);

  // Derive key and sign like the service
  const mnemonic = new EnglishMnemonic(workerMnemonic);
  const seed = await Bip39.mnemonicToSeed(mnemonic);
  const path = [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(118),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(0),
  ];
  const { privkey: privateKey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, path);
  const signature = await Secp256k1.createSignature(messageHash, privateKey);
  const fixedSignature = new Uint8Array([...signature.r(32), ...signature.s(32)]);
  const uncompressedPubKey = (await Secp256k1.makeKeypair(privateKey)).pubkey;
  const compressedPubKey = Secp256k1.compressPubkey(uncompressedPubKey);

  const workerDataBundle: InputWorkerDataBundle = {
    worker: workerAddress,
    nonce: { blockHeight: chosen.nonceHeight },
    topicId: chosen.topicId,
    inferenceForecastsBundle: bundle,
    inferencesForecastsBundleSignature: Buffer.from(fixedSignature),
    pubkey: Buffer.from(compressedPubKey).toString('hex'),
  };

  const workerDataBundleProto = InputWorkerDataBundle.fromPartial(workerDataBundle);
  const message: EncodeObject = {
    typeUrl: '/emissions.v9.InsertWorkerPayloadRequest',
    value: InsertWorkerPayloadRequest.fromPartial({
      sender: workerAddress,
      workerDataBundle: workerDataBundleProto,
    }),
  };

  // Prepare registry and client
  const registry = new Registry();
  Object.entries(defaultRegistryTypes).forEach(([k, v]) => registry.register(k, v as any));
  registry.register('/emissions.v9.InsertWorkerPayloadRequest', InsertWorkerPayloadRequest as any);

  const rpc = config.ALLORA_RPC_URLS.split(',')[0].trim();
  const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
    registry,
    gasPrice: GasPrice.fromString('10uallo'),
  });

  let gasUsed: number | null = null;
  if (!fastBroadcast) {
    const gas = await client.simulate(workerAddress, [message as any], undefined);
    gasUsed = Number(gas);
    logger.info({ gasUsed }, 'Simulation succeeded');
  }

  if (broadcast) {
    const gasLimit = fastBroadcast ? 180000 : Math.ceil(Number(gasUsed) * 1.2);
    const fee = calculateFee(gasLimit, GasPrice.fromString('10uallo'));
    const result = await client.signAndBroadcast(workerAddress, [message], fee, 'Simulation script test broadcast');
    logger.info({ code: result.code, txHash: result.transactionHash, rawLog: result.rawLog }, 'Broadcast result');
  }
}

main().catch((err) => {
  console.error('Simulation failed:', err?.message || err);
  logger.error({ err }, 'Simulation script failed');
  process.exitCode = 1;
});


