const express = require("express");
const authenticate = require("../../middlewares/authenticate");

const cashOfAccountController = require("../../controllers/cash-of-account/cashOfAccountController");
const router = express.Router();

router.get(
  "/cash-of-accounts",
  authenticate,
  cashOfAccountController.getAllChartOfAccounts
);
router.get(
  "/cash-of-accounts/banks",
  authenticate,
  cashOfAccountController.getAllBanks
);
router.get(
  "/cash-of-accounts/expenses",
  authenticate,
  cashOfAccountController.getAllExpenses
);
router.post(
  "/cash-of-accounts",
  authenticate,
  cashOfAccountController.createChartOfAccount
);
router.put(
  "/cash-of-accounts/:id",
  authenticate,
  cashOfAccountController.updateChartOfAccount
);
router.get(
  "/cash-of-accounts/:id",
  authenticate,
  cashOfAccountController.getOneChartOfAccount
);
router.delete(
  "/cash-of-accounts/:id",
  authenticate,
  cashOfAccountController.deleteChartOfAccount
);

module.exports = router;
