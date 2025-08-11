import { Router } from 'express';
import { getRecentSubmissions } from './submissions.controller';

const router = Router();

// GET /api/v1/submissions?modelId=...&topicId=...&limit=50
router.get('/', getRecentSubmissions);

export default router;




