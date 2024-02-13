const express = require('express');
const customerController = require('../../controllers/sales/customerController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/customers',authenticate, customerController.getCustomers);
router.get('/customers/:id', authenticate, customerController.getCustomerById);
router.post('/customers',authenticate, customerController.createCustomer);
router.put('/customers/:id', authenticate, customerController.updateCustomer);
router.delete('/customers/:id', authenticate, customerController.deleteCustomer);

module.exports = router;
