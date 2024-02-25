const express = require('express');
const storeController = require('../../controllers/store/storeController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/stores',authenticate, storeController.getStores);
router.post('/stores',authenticate, storeController.createStore);
router.put('/stores/:id',authenticate, storeController.updateStore);
router.delete('/stores/:id',authenticate, storeController.deleteStore);
router.get('/stores/:id',authenticate, storeController.getStoreById);

module.exports = router;