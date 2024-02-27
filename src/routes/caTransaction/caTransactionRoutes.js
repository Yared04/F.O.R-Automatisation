const express = require("express");
const caTransactionController = require("../../controllers/caTransaction/caTransactionController");

const router = express.Router();

router.get("/ca-transactions", caTransactionController.getCaTransactions);
router.post("/ca-transactions", caTransactionController.createCaTransaction);
router.get(
  "/ca-transactions/:id",
  caTransactionController.getCaTransactionById
);

module.exports = router;
