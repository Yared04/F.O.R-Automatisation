const express = require('express');
const reportController = require('../../controllers/report/reportController');
const apReportController = require('../../controllers/report/ApSummaryController');
const inventoryValuationController = require('../../controllers/report/InventoryValuationDetailController');
const profitAndLossController = require('../../controllers/report/profitAndLossController')
const balanceSheetController = require("../../controllers/report/balanceSheetController")
const authenticate = require('../../middlewares/authenticate');

const trialBalanceController = require('../../controllers/report/TrialBalanceController');

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

router.get('/ap-aging-report', (req, res) => {
  req.requiredPermissions = ['GenerateAPAgingReport'];
  authenticate(req, res, () => apReportController.generateApAgingSummary(req, res));
});

router.get('/trial-balance-report', (req, res) => {
  req.requiredPermissions = ['GenerateTrialBalanceReport'];
  authenticate(req, res, () => trialBalanceController.generateTrialBalance(req, res));
});

router.get('/inventory-valuation', (req, res) => {
  req.requiredPermissions = ['GenerateInventoryValuationReport'];
  authenticate(req, res, () => inventoryValuationController.generateInventoryValuation(req, res));
});

router.get('/profit-and-loss-report', (req, res) => {
  req.requiredPermissions = ['GenerateProfitAndLossReport'];
  authenticate(req, res, () => profitAndLossController.generateProfitAndLossReport(req, res));
});
router.get('/balance-sheet-report', (req, res) => {
  req.requiredPermissions = ['GenerateBalanceSheetReport'];
  authenticate(req, res, () => balanceSheetController.generateBalanceSheetReport(req, res));
});

module.exports = router;