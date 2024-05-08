const express = require("express");
const caTransactionController = require("../../controllers/caTransaction/caTransactionController");
const transitController = require("../../controllers/purchase/transitController");
const eslCustomController = require("../../controllers/purchase/eslCustomController");
const expensesPaymentController = require("../../controllers/purchase/expensesPaymentController");
const customerPaymentController = require("../../controllers/caTransaction/customerPaymentController");
const authenticate = require("../../middlewares/authenticate");

const router = express.Router();
router.use(authenticate);

router.get("/ca-transactions", (req, res) => {
  req.requiredPermissions = ["GetCaTransactions"];
  authenticate(req, res, () =>
    caTransactionController.getCaTransactions(req, res)
  );
});

router.get("/ca-transactions-summary", (req, res) => {
  req.requiredPermissions = ["GetCaTransaction"];
  authenticate(req, res, () =>
    caTransactionController.getCaTransactionsByMonth(req, res)
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

router.post("/ca-transactions/customer-payment", (req, res) => {
  req.requiredPermissions = ["CreateCustomerPayment"];
  authenticate(req, res, () =>
    customerPaymentController.createCustomerPayment(req, res)
  );
});

router.get("/transaction-with-split-report", (req, res) => {
  req.requiredPermissions = ["generateCaTransactionSummary"];
  authenticate(req, res, () =>
    caTransactionController.generateCaTransactionSummary(req, res)
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

router.post("/ca-transactions/journal-entry", (req, res) => {
  req.requiredPermissions = ["CreateJournalEntry"];
  authenticate(req, res, () =>
    caTransactionController.createJournalEntry(req, res)
  );
});

router.delete("/ca-transactions/journal-entry/:id", (req, res) => {
  req.requiredPermissions = ["DeleteJournalEntry"];
  authenticate(req, res, () =>
    caTransactionController.deleteJournalEntry(req, res)
  );
});

router.get("/ca-transactions/:id", (req, res) => {
  req.requiredPermissions = ["GetCaTransactionById"];
  authenticate(req, res, () =>
    caTransactionController.getCaTransactionById(req, res)
  );
});

router.delete("/ca-transactions/esl-payment/:paymentId", (req, res) => {
  req.requiredPermissions = ["DeleteEslPayment"];
  authenticate(req, res, () => eslCustomController.deleteEslPayment(req, res));
});

router.post("/ca-transactions/expenses-payment", (req, res) => {
  req.requiredPermissions = ["CreateExpensesPayment"];
  authenticate(req, res, () =>
  expensesPaymentController.createExpensesPayment(req, res)
  );
});

router.delete("/ca-transactions/expenses-payment/:transactionId", (req, res) => {
  req.requiredPermissions = ["DeleteExpensesPayment"];
  authenticate(req, res, () =>
  expensesPaymentController.deleteExpensesPayment(req, res)
  );
});

module.exports = router;
