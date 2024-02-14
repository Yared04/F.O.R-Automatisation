const express = require('express');
const supplierController = require('../../controllers/supplier/supplierController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/suppliers', authenticate, supplierController.getSuppliers);
router.post('/suppliers', authenticate, supplierController.createSupplier);
router.put('/suppliers/:id', authenticate, supplierController.updateSupplier);
router.delete('/suppliers/:id', authenticate, supplierController.deleteSupplier);
router.get('/suppliers/:id', authenticate, supplierController.getSupplierById);

module.exports = router;