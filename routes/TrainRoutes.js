import express from 'express';
import { getLiveTrainStatus, checkPNRStatus, getCoachPosition, getPlatformLocator } from '../controllers/TrainController.js';

const router = express.Router();

router.get('/live-status', getLiveTrainStatus);
router.get('/pnr', checkPNRStatus);
router.get('/coach-position', getCoachPosition);
router.get('/platform-locator', getPlatformLocator);

export default router;
