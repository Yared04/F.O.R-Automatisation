const express = require('express');

const cashOfAccountController = require('../../controllers/cash-of-account/cashOfAccountController');
const router = express.Router();


router.get('/cash-of-accounts', cashOfAccountController.getAllCashOfAccounts);
router.post('/cash-of-accounts', cashOfAccountController.createCashOfAccount);
router.put('/cash-of-accounts/:id', cashOfAccountController.updateCashOfAccount);
router.get('/cash-of-accounts/:id', cashOfAccountController.getOneCashOfAccount);
router.delete('/cash-of-accounts/:id', cashOfAccountController.deleteCashOfAccount);

module.exports = router;