import 'dotenv/config';
import { config } from '../src/config';
import logger from '../src/utils/logger';
import pool from '../src/persistence/postgres.client';
import secretsService from '../src/core/secrets/secrets.service';
import axios from 'axios';

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
  InputForecastElement,
  InputWorkerDataBundle,
  InsertWorkerPayloadRequest,
} from '../src/generated/allora_worker';

import alloraConnectorService from '../src/core/allora-connector/allora-connector.service';
import { formatToBoundedExp40Dec } from '../src/core/allora-connector/bounded-exp40dec';

async function main() {
  const log = logger.child({ script: 'simulate-worker-payload' });

  // Optional envs to control behavior
  const overrideModelId = process.env.MODEL_ID || undefined;
  const overrideMnemonic = process.env.WORKER_MNEMONIC || undefined;
  const broadcast = /^true$/i.test(String(process.env.BROADCAST || 'false'));

  log.info({ broadcast, overrideModelId: !!overrideModelId }, 'Starting simulation script');

  // 1) Resolve a worker wallet (require provided mnemonic or DB secret)
  let workerAddress: string;
  let workerMnemonic: string;

  if (overrideMnemonic) {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(overrideMnemonic, { prefix: 'allo' });
    const [acct] = await wallet.getAccounts();
    workerAddress = acct.address;
    workerMnemonic = overrideMnemonic;
  } else {
    // Fetch a model and its wallet
    const modelRow = overrideModelId
      ? await pool.query('SELECT id, wallet_id, topic_id FROM models WHERE id = $1 LIMIT 1', [overrideModelId])
      : await pool.query('SELECT id, wallet_id, topic_id FROM models ORDER BY created_at DESC LIMIT 1');
    const model = modelRow.rows[0];
    if (!model) throw new Error('No model found in database. Provide WORKER_MNEMONIC or create a model.');

    const walletRow = await pool.query('SELECT id, address, secret_ref FROM wallets WHERE id = $1', [model.wallet_id]);
    const wallet = walletRow.rows[0];
    if (!wallet) throw new Error('Wallet not found for selected model.');

    const mnemonic = await secretsService.getSecret(wallet.secret_ref);
    if (!mnemonic) throw new Error('Could not load wallet mnemonic from secrets.');

    workerAddress = wallet.address;
    workerMnemonic = mnemonic;
  }

  log.info({ workerAddress }, 'Using worker wallet');

  // 2) Scan topics 1..100 to find an active topic with open worker nonce and allowance for this worker
  let chosen: { topicId: number; nonceHeight: number } | null = null;
  for (let id = config.ACTIVE_TOPICS_SCAN_START_ID; id <= config.ACTIVE_TOPICS_SCAN_END_ID; id++) {
    const t = await alloraConnectorService.getTopicDetails(String(id));
    if (!t || !t.isActive) continue;
    const nonce = await alloraConnectorService.deriveLatestOpenWorkerNonce(String(id));
    if (nonce == null) continue;
    const allowed = await alloraConnectorService.canSubmitWorker(String(id), workerAddress);
    if (!allowed) continue;
    chosen = { topicId: id, nonceHeight: nonce };
    break;
  }

  if (!chosen) {
    log.error('No eligible topic found with an open worker nonce for this worker');
    process.exitCode = 1;
    return;
  }

  log.info({ chosen }, 'Selected topic and nonce');

  // 3) Build payload like the service does (inference only for simplicity)
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
    forecast: undefined as unknown as InputForecast | undefined,
  };

  const bundleProto = InputInferenceForecastBundle.fromPartial(bundle);
  const messageBytes = InputInferenceForecastBundle.encode(bundleProto).finish();
  const messageHash = sha256(messageBytes);

  // Derive key and sign
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
  const pubKey = (await Secp256k1.makeKeypair(privateKey)).pubkey;

  const workerDataBundle: InputWorkerDataBundle = {
    worker: workerAddress,
    nonce: { blockHeight: chosen.nonceHeight },
    topicId: chosen.topicId,
    inferenceForecastsBundle: bundle,
    inferencesForecastsBundleSignature: Buffer.from(fixedSignature),
    pubkey: Buffer.from(pubKey).toString('hex'),
  };

  const workerDataBundleProto = InputWorkerDataBundle.fromPartial(workerDataBundle);
  const message: EncodeObject = {
    typeUrl: '/emissions.v9.InsertWorkerPayloadRequest',
    value: InsertWorkerPayloadRequest.fromPartial({
      sender: workerAddress,
      workerDataBundle: workerDataBundleProto,
    }),
  };

  // 4) Prepare registry and client
  const registry = new Registry();
  Object.entries(defaultRegistryTypes).forEach(([k, v]) => registry.register(k, v as any));
  registry.register('/emissions.v9.InsertWorkerPayloadRequest', InsertWorkerPayloadRequest as any);

  const rpc = config.ALLORA_RPC_URLS.split(',')[0].trim();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(workerMnemonic, { prefix: 'allo' });
  const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
    registry,
    gasPrice: GasPrice.fromString('10uallo'),
  });

  // 5) Simulate
  const gas = await client.simulate(workerAddress, [message as any], undefined);
  logger.info({ gasUsed: Number(gas) }, 'Simulation succeeded');

  if (broadcast) {
    const gasLimit = Math.ceil(Number(gas) * 1.2);
    const fee = calculateFee(gasLimit, GasPrice.fromString('10uallo'));
    const result = await client.signAndBroadcast(workerAddress, [message], fee, 'Simulation script test broadcast');
    logger.info({ code: result.code, txHash: result.transactionHash, rawLog: result.rawLog }, 'Broadcast result');
  }
}

main().catch((err) => {
  // Print a concise message for quick signal
  console.error('Simulation failed:', err?.message || err);
  // Also include the full error for logs
  logger.error({ err }, 'Simulation script failed');
  process.exitCode = 1;
});


