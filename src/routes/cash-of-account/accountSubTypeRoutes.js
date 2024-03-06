const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/authenticate');

const accountSubTypeController = require('../../controllers/cash-of-account/accountSubTypeController');
router.use(authenticate);

router.post('/account-sub-types', (req, res) => {
  req.requiredPermissions = ['CreateAccountSubType'];
  authenticate(req, res, () => accountSubTypeController.createAccountSubType(req, res));
});

router.get('/account-sub-types', (req, res) => {
  req.requiredPermissions = ['GetAllAccountSubTypes'];
  authenticate(req, res, () => accountSubTypeController.getAllAccountSubTypes(req, res));
});

router.get('/account-sub-types/:id', (req, res) => {
  req.requiredPermissions = ['GetAccountSubTypeById'];
  authenticate(req, res, () => accountSubTypeController.getAccountSubTypeById(req, res));
});

router.put('/account-sub-types/:id', (req, res) => {
  req.requiredPermissions = ['UpdateAccountSubType'];
  authenticate(req, res, () => accountSubTypeController.updateAccountSubType(req, res));
});

router.delete('/account-sub-types/:id', (req, res) => {
  req.requiredPermissions = ['DeleteAccountSubType'];
  authenticate(req, res, () => accountSubTypeController.deleteAccountSubType(req, res));
});

module.exports = router;
