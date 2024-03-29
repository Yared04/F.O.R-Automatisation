const express = require("express");
const caTransactionController = require("../../controllers/caTransaction/caTransactionController");
const transitController = require("../../controllers/purchase/transitController");
const eslCustomController = require("../../controllers/purchase/eslCustomController");
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

router.post("/ca-transactions/transit-payment", (req, res) => {
  req.requiredPermissions = ["CreateTransitPayment"];
  authenticate(req, res, () =>
    transitController.createTransitPayment(req, res)
  );
});

router.post("/ca-transactions/esl-payment", (req, res) => {
  req.requiredPermissions = ["CreateEslPayment"];
  authenticate(req, res, () => eslCustomController.createESLPayment(req, res));
});

router.post("ca-transactions/customer-payment", (req, res) => {
  req.requiredPermissions = ["CreateCustomerPayment"];
  authenticate(req, res, () =>
    caTransactionController.createCustomerPayment(req, res)
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
