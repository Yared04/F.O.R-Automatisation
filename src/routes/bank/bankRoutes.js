const express = require("express");
const bankController = require("../../controllers/bank/bankController");
const authenticate = require("../../middlewares/authenticate");

const router = express.Router();
router.use(authenticate);

router.get("/banks", (req, res) => {
  req.requiredPermissions = ["GetBanks"];
  authenticate(req, res, () => bankController.getBanks(req, res));
});

router.post("/banks", (req, res) => {
  req.requiredPermissions = ["CreateBank"];
  authenticate(req, res, () => bankController.createBank(req, res));
});

router.put("/banks/:id", (req, res) => {
  req.requiredPermissions = ["UpdateBank"];
  authenticate(req, res, () => bankController.updateBank(req, res));
});

router.delete("/banks/:id", (req, res) => {
  req.requiredPermissions = ["DeleteBank"];
  authenticate(req, res, () => bankController.deleteBank(req, res));
});

router.get("/banks/:id", (req, res) => {
  req.requiredPermissions = ["GetBankById"];
  authenticate(req, res, () => bankController.getBankById(req, res));
});

module.exports = router;
