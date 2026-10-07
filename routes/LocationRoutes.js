import express from 'express';
import { getIndianStatesAndCities, getCitiesForState } from '../controllers/LocationController.js';

const router = express.Router();

router.get('/india', getIndianStatesAndCities);
router.get('/cities', getCitiesForState);

export default router;
