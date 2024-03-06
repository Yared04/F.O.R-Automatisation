const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/authenticate');

const accountTypeController = require('../../controllers/cash-of-account/accountTypeController');
router.use(authenticate);

router.post('/account-types', (req, res) => {
  req.requiredPermissions = ['CreateAccountType'];
  authenticate(req, res, () => accountTypeController.createAccountType(req, res));
});

router.get('/account-types', (req, res) => {
  req.requiredPermissions = ['GetAllAccountTypes'];
  authenticate(req, res, () => accountTypeController.getAllAccountTypes(req, res));
});

router.get('/account-types/:id', (req, res) => {
  req.requiredPermissions = ['GetAccountTypeById'];
  authenticate(req, res, () => accountTypeController.getAccountTypeById(req, res));
});

router.put('/account-types/:id', (req, res) => {
  req.requiredPermissions = ['UpdateAccountType'];
  authenticate(req, res, () => accountTypeController.updateAccountType(req, res));
});

router.delete('/account-types/:id', (req, res) => {
  req.requiredPermissions = ['DeleteAccountType'];
  authenticate(req, res, () => accountTypeController.deleteAccountType(req, res));
});

module.exports = router;
