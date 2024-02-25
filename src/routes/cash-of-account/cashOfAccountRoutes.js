const express = require('express');
const authenticate = require('../../middlewares/authenticate')

const cashOfAccountController = require('../../controllers/cash-of-account/cashOfAccountController');
const router = express.Router();


router.get('/cash-of-accounts', authenticate, cashOfAccountController.getAllCashOfAccounts);
router.post('/cash-of-accounts', authenticate, cashOfAccountController.createCashOfAccount);
router.put('/cash-of-accounts/:id', authenticate, cashOfAccountController.updateCashOfAccount);
router.get('/cash-of-accounts/:id', authenticate, cashOfAccountController.getOneCashOfAccount);
router.delete('/cash-of-accounts/:id', authenticate, cashOfAccountController.deleteCashOfAccount);

module.exports = router;