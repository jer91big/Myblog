import express from 'express';
import { searchArticles } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchArticles);

export default router;
