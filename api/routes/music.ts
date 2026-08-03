import express from 'express';
import { getPlaylist, proxySong, debugSong } from '../controllers/musicController.js';

const router = express.Router();

router.get('/playlist', getPlaylist);
router.get('/proxy', proxySong);
router.get('/debug', debugSong);

export default router;
