import { Request, Response } from 'express';
import pool from '@/persistence/postgres.client';
import logger from '@/utils/logger';

export const getRecentSubmissions = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'getRecentSubmissions' });
  try {
    const modelId = String(req.query.modelId || '');
    const topicId = String(req.query.topicId || '');
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const where: string[] = [];
    const params: any[] = [];
    if (modelId) { where.push(`model_id = $${params.length + 1}`); params.push(modelId); }
    if (topicId) { where.push(`topic_id = $${params.length + 1}`); params.push(topicId); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `SELECT id, model_id, topic_id, nonce_height, tx_hash, status, raw_log, created_at
                 FROM submissions ${whereSql}
                 ORDER BY created_at DESC
                 LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(sql, params);
    return res.json({ submissions: result.rows });
  } catch (err) {
    log.error({ err }, 'Failed to fetch submissions');
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};


