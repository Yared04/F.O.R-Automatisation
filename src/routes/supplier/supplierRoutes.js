const express = require('express');
const supplierController = require('../../controllers/supplier/supplierController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/suppliers', (req, res) => {
  req.requiredPermissions = ['GetSuppliers'];
  authenticate(req, res, () => supplierController.getSuppliers(req, res));
});

router.post('/suppliers', (req, res) => {
  req.requiredPermissions = ['CreateSupplier'];
  authenticate(req, res, () => supplierController.createSupplier(req, res));
});

router.put('/suppliers/:id', (req, res) => {
  req.requiredPermissions = ['UpdateSupplier'];
  authenticate(req, res, () => supplierController.updateSupplier(req, res));
});

router.delete('/suppliers/:id', (req, res) => {
  req.requiredPermissions = ['DeleteSupplier'];
  authenticate(req, res, () => supplierController.deleteSupplier(req, res));
});

router.get('/suppliers/:id', (req, res) => {
  req.requiredPermissions = ['GetSupplierById'];
  authenticate(req, res, () => supplierController.getSupplierById(req, res));
});

module.exports = router;
