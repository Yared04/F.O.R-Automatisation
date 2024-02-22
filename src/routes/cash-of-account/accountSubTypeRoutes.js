const express = require('express');
const router = express.Router();

const accountSubTypeController = require('../../controllers/cash-of-account/accountSubTypeController');

router.post('/account-sub-types', accountSubTypeController.createAccountSubType);
router.get('/account-sub-types', accountSubTypeController.getAllAccountSubTypes);
router.get('/account-sub-types/:id', accountSubTypeController.getAccountSubTypeById);
router.put('/account-sub-types/:id', accountSubTypeController.updateAccountSubType);
router.delete('/account-sub-types/:id', accountSubTypeController.deleteAccountSubType);

module.exports = router;
