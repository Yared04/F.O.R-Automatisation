const express = require('express');
const storeController = require('../../controllers/store/storeController');

const router = express.Router();

router.get('/stores', storeController.getStores);
router.post('/stores', storeController.createStore);
router.put('/stores/:id', storeController.updateStore);
router.delete('/stores/:id', storeController.deleteStore);
router.get('/stores/:id', storeController.getStoreById);

module.exports = router;