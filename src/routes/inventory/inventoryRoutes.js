const express = require('express');
const inventoryController = require('../../controllers/inventory/inventoryController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/inventory', authenticate, inventoryController.getInventory);
router.get('/inventory/:id', authenticate, inventoryController.getInventoryById);

module.exports = router;