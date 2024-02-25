const express = require('express')
const purchaseController = require('../../controllers/purchase/purchaseController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/purchases', authenticate, purchaseController.getPurchases);
router.post('/purchases', authenticate, purchaseController.createPurchase);
router.get('/purchases/:id', authenticate, purchaseController.getPurchaseById);
router.put('/purchases/:id', authenticate, purchaseController.updatePurchase);
router.delete('/purchases/:id', authenticate, purchaseController.deletePurchase);

module.exports = router;
