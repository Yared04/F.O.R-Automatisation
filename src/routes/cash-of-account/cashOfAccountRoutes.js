const express = require("express");
const authenticate = require("../../middlewares/authenticate");

const cashOfAccountController = require("../../controllers/cash-of-account/cashOfAccountController");
const router = express.Router();
router.use(authenticate);

router.get("/cash-of-accounts", (req, res) => {
  req.requiredPermissions = ['GetAllChartOfAccounts'];
  authenticate(req, res, () => cashOfAccountController.getAllChartOfAccounts(req, res));
});

router.get("/cash-of-accounts/banks", (req, res) => {
  req.requiredPermissions = ['GetAllBanks'];
  authenticate(req, res, () => cashOfAccountController.getAllBanks(req, res));
});

router.get("/cash-of-accounts/expenses", (req, res) => {
  req.requiredPermissions = ['GetAllExpenses'];
  authenticate(req, res, () => cashOfAccountController.getAllExpenses(req, res));
});

router.post("/cash-of-accounts", (req, res) => {
  req.requiredPermissions = ['CreateChartOfAccount'];
  authenticate(req, res, () => cashOfAccountController.createChartOfAccount(req, res));
});

router.put("/cash-of-accounts/:id", (req, res) => {
  req.requiredPermissions = ['UpdateChartOfAccount'];
  authenticate(req, res, () => cashOfAccountController.updateChartOfAccount(req, res));
});

router.get("/cash-of-accounts/:id", (req, res) => {
  req.requiredPermissions = ['GetOneChartOfAccount'];
  authenticate(req, res, () => cashOfAccountController.getOneChartOfAccount(req, res));
});

router.delete("/cash-of-accounts/:id", (req, res) => {
  req.requiredPermissions = ['DeleteChartOfAccount'];
  authenticate(req, res, () => cashOfAccountController.deleteChartOfAccount(req, res));
});

module.exports = router;
