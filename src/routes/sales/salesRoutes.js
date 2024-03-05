const express = require('express');
const salesController = require('../../controllers/sales/salesController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/sales',authenticate, salesController.getSales);
router.post('/sales', authenticate, salesController.createSale);
router.get('/sales/:id', authenticate, salesController.getSaleById);
router.delete('/sales/:id', authenticate, salesController.deleteSaleById);

module.exports = router;