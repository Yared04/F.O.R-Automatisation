const express = require('express');
const accountTypeController = require('../../controllers/cash-of-account/accountTypeController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.post('/account-types', authenticate, accountTypeController.createAccountType);
router.get('/account-types', authenticate, accountTypeController.getAllAccountTypes);
router.get('/account-types/:id', authenticate, accountTypeController.getAccountTypeById);
router.put('/account-types/:id', authenticate, accountTypeController.updateAccountType);
router.delete('/account-types/:id', authenticate, accountTypeController.deleteAccountType);

module.exports = router;