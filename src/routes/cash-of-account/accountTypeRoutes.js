const express = require('express');
const accountTypeController = require('../../controllers/cash-of-account/accountTypeController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.post('/account-types', accountTypeController.createAccountType);
router.get('/account-types', accountTypeController.getAllAccountTypes);
router.get('/account-types/:id', accountTypeController.getAccountTypeById);
router.put('/account-types/:id', accountTypeController.updateAccountType);
router.delete('/account-types/:id', accountTypeController.deleteAccountType);

module.exports = router;