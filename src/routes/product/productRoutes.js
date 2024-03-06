const express = require('express');
const productController = require('../../controllers/product/productController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/products', (req, res) => {
  req.requiredPermissions = ['GetProducts'];
  authenticate(req, res, () => productController.getProducts(req, res));
});

router.post('/products', (req, res) => {
  req.requiredPermissions = ['CreateProduct'];
  authenticate(req, res, () => productController.createProduct(req, res));
});

router.put('/products/:id', (req, res) => {
  req.requiredPermissions = ['UpdateProduct'];
  authenticate(req, res, () => productController.updateProduct(req, res));
});

router.delete('/products/:id', (req, res) => {
  req.requiredPermissions = ['DeleteProduct'];
  authenticate(req, res, () => productController.deleteProduct(req, res));
});

router.get('/products/:id', (req, res) => {
  req.requiredPermissions = ['GetProductById'];
  authenticate(req, res, () => productController.getProductById(req, res));
});

module.exports = router;
