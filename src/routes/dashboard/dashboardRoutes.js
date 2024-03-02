const express = require('express');
const dashboardController = require('../../controllers/dashboard/dashboardController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/dashboard/expenses', dashboardController.getExpenseDetails);
router.get('/dashboard/bank-positions', dashboardController.getBankDetails);


module.exports = router;