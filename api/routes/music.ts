import express from 'express';
import { getPlaylist, getSongUrl } from '../controllers/musicController.js';

const router = express.Router();

router.get('/playlist', getPlaylist);
router.get('/song-url', getSongUrl);

export default router;
