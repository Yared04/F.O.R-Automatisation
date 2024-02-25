const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/authenticate')

const accountSubTypeController = require('../../controllers/cash-of-account/accountSubTypeController');

router.post('/account-sub-types', authenticate, accountSubTypeController.createAccountSubType);
router.get('/account-sub-types', authenticate, accountSubTypeController.getAllAccountSubTypes);
router.get('/account-sub-types/:id', authenticate, accountSubTypeController.getAccountSubTypeById);
router.put('/account-sub-types/:id', authenticate, accountSubTypeController.updateAccountSubType);
router.delete('/account-sub-types/:id', authenticate, accountSubTypeController.deleteAccountSubType);

module.exports = router;
