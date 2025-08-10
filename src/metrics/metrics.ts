import client from 'prom-client';

// Register default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const submissionSuccess = new client.Counter({
  name: 'submission_success_total',
  help: 'Total successful worker payload submissions',
  labelNames: ['topicId'],
});

export const submissionFailure = new client.Counter({
  name: 'submission_failure_total',
  help: 'Total failed worker payload submissions',
  labelNames: ['topicId', 'reason'],
});

export const nodeSwitches = new client.Counter({
  name: 'node_switch_total',
  help: 'Total RPC node switches due to errors',
  labelNames: ['type'],
});

export const outOfGasRetries = new client.Counter({
  name: 'out_of_gas_retries_total',
  help: 'Total retries due to out-of-gas',
  labelNames: ['context'],
});

register.registerMetric(submissionSuccess);
register.registerMetric(submissionFailure);
register.registerMetric(nodeSwitches);
register.registerMetric(outOfGasRetries);

export { register };


