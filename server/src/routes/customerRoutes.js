const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getCustomers, 
  getCustomerById,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerProfile,
  updateCustomerProfile
} = require('../controllers/customerController');

// Customer Profile CRUD
router.get('/profile', protect, getCustomerProfile);
router.put('/profile', protect, updateCustomerProfile);

// Customer Delivery Addresses CRUD
router.get('/addresses', protect, getCustomerAddresses);
router.post('/addresses', protect, addCustomerAddress);
router.put('/addresses/:id', protect, updateCustomerAddress);
router.delete('/addresses/:id', protect, deleteCustomerAddress);

router.get('/', protect, requireProvider, getCustomers);
router.get('/:id', protect, requireProvider, getCustomerById);

module.exports = router;
