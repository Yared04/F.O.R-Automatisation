const express = require('express');
const inventoryController = require('../../controllers/inventory/inventoryController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/inventory', (req, res) => {
  req.requiredPermissions = ['GetInventory'];
  authenticate(req, res, () => inventoryController.getInventory(req, res));
});

router.get('/inventory/:id', (req, res) => {
  req.requiredPermissions = ['GetInventoryById'];
  authenticate(req, res, () => inventoryController.getInventoryById(req, res));
});

module.exports = router;
