const express = require('express')
const purchaseController = require('../../controllers/purchase/purchaseController');

const router = express.Router();

router.get('/purchases', purchaseController.getPurchases);
router.post('/purchases', purchaseController.createPurchase);

module.exports = router;