const express = require('express');
const purchaseController = require('../../controllers/purchase/purchaseController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/purchases', (req, res) => {
  req.requiredPermissions = ['GetPurchases'];
  authenticate(req, res, () => purchaseController.getPurchases(req, res));
});

router.post('/purchases', (req, res) => {
  req.requiredPermissions = ['CreatePurchase'];
  authenticate(req, res, () => purchaseController.createPurchase(req, res));
});

router.get('/purchases/:id', (req, res) => {
  req.requiredPermissions = ['GetPurchaseById'];
  authenticate(req, res, () => purchaseController.getPurchaseById(req, res));
});

router.put('/purchases/:id', (req, res) => {
  req.requiredPermissions = ['UpdatePurchase'];
  authenticate(req, res, () => purchaseController.updatePurchase(req, res));
});

router.delete('/purchases/:id', (req, res) => {
  req.requiredPermissions = ['DeletePurchase'];
  authenticate(req, res, () => purchaseController.deletePurchase(req, res));
});

module.exports = router;
