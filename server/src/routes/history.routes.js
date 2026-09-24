import { Router } from 'express'
import * as controller from '../controllers/history.controller.js'

/**
 * REST endpoints for the conversion history.
 *
 *   GET    /api/history       list recent conversions (newest first)
 *   POST   /api/history       save one conversion
 *   DELETE /api/history/:id   delete one conversion
 *   DELETE /api/history       delete every conversion
 */
const router = Router()

router.get('/', controller.getHistory)
router.post('/', controller.postHistory)
router.delete('/:id', controller.deleteHistoryItem)
router.delete('/', controller.deleteAllHistory)

export default router
