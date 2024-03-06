const express = require('express');
const customerController = require('../../controllers/customer/customerController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/customers', (req, res) => {
  req.requiredPermissions = ['GetCustomers'];
  authenticate(req, res, () => customerController.getCustomers(req, res));
});

router.get('/customers/:id', (req, res) => {
  req.requiredPermissions = ['GetCustomerById'];
  authenticate(req, res, () => customerController.getCustomerById(req, res));
});

router.post('/customers', (req, res) => {
  req.requiredPermissions = ['CreateCustomer'];
  authenticate(req, res, () => customerController.createCustomer(req, res));
});

router.put('/customers/:id', (req, res) => {
  req.requiredPermissions = ['UpdateCustomer'];
  authenticate(req, res, () => customerController.updateCustomer(req, res));
});

router.delete('/customers/:id', (req, res) => {
  req.requiredPermissions = ['DeleteCustomer'];
  authenticate(req, res, () => customerController.deleteCustomer(req, res));
});

module.exports = router;
