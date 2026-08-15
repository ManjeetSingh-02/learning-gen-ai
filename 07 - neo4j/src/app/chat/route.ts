// internal-imports
import { controller } from './controller.js';

// external-imports
import { Router } from 'express';

// router for module
export const router = Router();

// @route POST /
router.post('/', controller.chat);
