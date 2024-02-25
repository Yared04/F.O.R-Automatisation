const express = require("express");
const caTransactionController = require("../../controllers/caTransaction/caTransactionController");

const router = express.Router();

router.get("/caTransactions", caTransactionController.getCaTransactions);
router.post("/caTransactions", caTransactionController.createCaTransaction);
router.get("/caTransactions/:id", caTransactionController.getCaTransactionById);

module.exports = router;
