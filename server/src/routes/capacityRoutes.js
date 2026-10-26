const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getCapacity,
  updateCapacitySettings,
  updateDateCapacity,
  checkCapacityAvailable,
  getPublicProviderAvailability
} = require('../controllers/capacityController');

router.get('/availability/:providerId', getPublicProviderAvailability);
router.get('/', protect, requireProvider, getCapacity);
router.post('/settings', protect, requireProvider, updateCapacitySettings);
router.put('/date', protect, requireProvider, updateDateCapacity);
router.get('/check-today', protect, checkCapacityAvailable);

module.exports = router;

