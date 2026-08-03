import express from 'express';
import { getPlaylist, proxySong } from '../controllers/musicController.js';

const router = express.Router();

router.get('/playlist', getPlaylist);
router.get('/proxy', proxySong);

export default router;
