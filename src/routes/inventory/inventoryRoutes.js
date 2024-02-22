const express = require('express');
const inventoryController = require('../../controllers/inventory/inventoryController');

const router = express.Router();

router.get('/inventory', inventoryController.getInventory);
router.get('/inventory/:id', inventoryController.getInventoryById);

module.exports = router;