const express = require('express');
const storeController = require('../../controllers/store/storeController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/stores', (req, res) => {
  req.requiredPermissions = ['GetStores'];
  authenticate(req, res, () => storeController.getStores(req, res));
});

router.post('/stores', (req, res) => {
  req.requiredPermissions = ['CreateStore'];
  authenticate(req, res, () => storeController.createStore(req, res));
});

router.put('/stores/:id', (req, res) => {
  req.requiredPermissions = ['UpdateStore'];
  authenticate(req, res, () => storeController.updateStore(req, res));
});

router.delete('/stores/:id', (req, res) => {
  req.requiredPermissions = ['DeleteStore'];
  authenticate(req, res, () => storeController.deleteStore(req, res));
});

router.get('/stores/:id', (req, res) => {
  req.requiredPermissions = ['GetStoreById'];
  authenticate(req, res, () => storeController.getStoreById(req, res));
});

module.exports = router;
