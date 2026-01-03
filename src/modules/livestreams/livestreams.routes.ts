import { Router } from 'express';
import livestreamsController from './livestreams.controller';

const router = Router();

// GET /api/livestreams - Obtener todos los livestreams (con filtros opcionales)
router.get('/', livestreamsController.getLivestreams.bind(livestreamsController));

// GET /api/livestreams/active - Obtener el livestream activo
router.get('/active', livestreamsController.getActiveLivestream.bind(livestreamsController));

// GET /api/livestreams/:id - Obtener un livestream por ID
router.get('/:id', livestreamsController.getLivestreamById.bind(livestreamsController));

// GET /api/livestreams/:id/stats - Obtener estadísticas del livestream
router.get('/:id/stats', livestreamsController.getLivestreamStats.bind(livestreamsController));

// GET /api/livestreams/:id/detailed-stats - Obtener estadísticas detalladas del livestream
router.get('/:id/detailed-stats', livestreamsController.getDetailedStats.bind(livestreamsController));

// POST /api/livestreams - Crear/Iniciar un livestream
router.post('/', livestreamsController.createLivestream.bind(livestreamsController));

// PUT /api/livestreams/:id - Actualizar un livestream
router.put('/:id', livestreamsController.updateLivestream.bind(livestreamsController));

// POST /api/livestreams/:id/close - Cerrar un livestream
router.post('/:id/close', livestreamsController.closeLivestream.bind(livestreamsController));

// DELETE /api/livestreams/:id - Eliminar un livestream (solo si no tiene ventas)
router.delete('/:id', livestreamsController.deleteLivestream.bind(livestreamsController));

export default router;
