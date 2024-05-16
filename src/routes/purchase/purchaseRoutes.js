const express = require("express");
const purchaseController = require("../../controllers/purchase/purchaseController");
const transportController = require("../../controllers/purchase/transportController");
const transitController = require("../../controllers/purchase/transitController");
const authenticate = require("../../middlewares/authenticate");

const router = express.Router();
router.use(authenticate);

router.get("/purchases", (req, res) => {
  req.requiredPermissions = ["GetPurchases"];
  authenticate(req, res, () => purchaseController.getPurchases(req, res));
});

router.post("/purchases", (req, res) => {
  req.requiredPermissions = ["CreatePurchase"];
  authenticate(req, res, () => purchaseController.createPurchase(req, res));
});

router.post("/purchases/transport-payment", (req, res) => {
  req.requiredPermissions = ["CreateTransportPayment"];
  authenticate(req, res, () =>
    transportController.createTransportPayment(req, res)
  );
});

router.get('/purchases/waybill-number/latest', (req, res) => {
  
  req.requiredPermissions = ['GetPurchaseWaybillNumber'];
  authenticate(req, res, () => purchaseController.getPurchaseWaybillNumber(req, res));
});

router.post("/purchases/transit-fee", (req, res) => {
  req.requiredPermissions = ["CreateTransitFee"];
  authenticate(req, res, () => transitController.createTransitFee(req, res));
});

router.post("/purchases/esl-custom", (req, res) => {
  req.requiredPermissions = ["CreateEslCustom"];
  authenticate(req, res, () =>
    eslCustomController.createEslCustom(req, res)
  );
});
router.get("/purchases/:id", (req, res) => {
  req.requiredPermissions = ["GetPurchaseById"];
  authenticate(req, res, () => purchaseController.getPurchaseById(req, res));
});

router.put("/purchases/:id", (req, res) => {
  req.requiredPermissions = ["UpdatePurchase"];
  authenticate(req, res, () => purchaseController.updatePurchase(req, res));
});

router.delete("/purchases/:id", (req, res) => {
  req.requiredPermissions = ["DeletePurchase"];
  authenticate(req, res, () => purchaseController.deletePurchase(req, res));
});

router.get("/transports", (req, res) => {
  req.requiredPermissions = ["GetTransportCost"];
  authenticate(req, res, () => purchaseController.getTransportCosts(req, res));
});

router.get("/esl", (req, res) => {
  req.requiredPermissions = ["GetEslCustomCost"];
  authenticate(req, res, () => purchaseController.getEslCosts(req, res));
});

router.get("/transit-fees", (req, res) => {
  req.requiredPermissions = ["GetTransiFees"];
  authenticate(req, res, () => purchaseController.getTransiFees(req, res));
});

router.delete("/purchases/transport-payment/:paymentId", (req, res) => {
  req.requiredPermissions = ["DeleteTransportPayment"];
  authenticate(req, res, () =>
    transportController.deleteTransportPayment(req, res)
  );
});

router.delete("/purchases/transit-payment/:paymentId", (req, res) => {
  req.requiredPermissions = ["DeleteTransitPayment"];
  authenticate(req, res, () => transitController.deleteTransitPayment(req, res));
});

module.exports = router;
