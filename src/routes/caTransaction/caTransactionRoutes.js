const express = require("express");
const caTransactionController = require("../../controllers/caTransaction/caTransactionController");
const authenticate = require("../../middlewares/authenticate");

const router = express.Router();
router.use(authenticate);

router.get("/ca-transactions", (req, res) => {
  req.requiredPermissions = ["GetCaTransactions"];
  authenticate(req, res, () =>
    caTransactionController.getCaTransactions(req, res)
  );
});

router.post("/ca-transactions", (req, res) => {
  req.requiredPermissions = ["CreateCaTransaction"];
  authenticate(req, res, () =>
    caTransactionController.createCaTransaction(req, res)
  );
});

router.post("/ca-transactions/supplier-payment", (req, res) => {
  req.requiredPermissions = ["CreateSupplierPayment"];
  authenticate(req, res, () =>
    caTransactionController.createSupplierPayment(req, res)
  );
});

router.post("/ca-transactions/bank-transaction", (req, res) => {
  req.requiredPermissions = ["CreateBankTransaction"];
  authenticate(req, res, () =>
    caTransactionController.createBankTransaction(req, res)
  );
});

router.get("/ca-transactions/:id", (req, res) => {
  req.requiredPermissions = ["GetCaTransactionById"];
  authenticate(req, res, () =>
    caTransactionController.getCaTransactionById(req, res)
  );
});

module.exports = router;
