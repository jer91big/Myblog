import express from 'express';
import { generateSitemap } from '../controllers/sitemapController';

const router = express.Router();

router.get('/', generateSitemap);

export default router;
