const express = require('express');
const reportController = require('../../controllers/report/reportController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/customer-aging-report', (req, res) => {
  req.requiredPermissions = ['GetSales'];
  authenticate(req, res, () => reportController.generateCustomerAgingSummary(req, res));
});

module.exports = router;