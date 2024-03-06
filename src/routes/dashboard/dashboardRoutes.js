const express = require('express');
const dashboardController = require('../../controllers/dashboard/dashboardController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard/expenses', (req, res) => {
  req.requiredPermissions = ['GetExpenseDetails'];
  authenticate(req, res, () => dashboardController.getExpenseDetails(req, res));
});

router.get('/dashboard/bank-positions', (req, res) => {
  req.requiredPermissions = ['GetBankDetails'];
  authenticate(req, res, () => dashboardController.getBankDetails(req, res));
});

module.exports = router;
