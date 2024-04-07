const express = require('express');
const reportController = require('../../controllers/report/reportController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/customer-aging-report', (req, res) => {
  req.requiredPermissions = ['GenerateCustomerAgingReport'];
  authenticate(req, res, () => reportController.generateCustomerAgingSummary(req, res));
});

router.get('/bank-transaction-report', (req, res) => {
  req.requiredPermissions = ['GenerateBankTransactionReport'];
  authenticate(req, res, () => reportController.generateBankTransactionSummary(req, res));
});

module.exports = router;