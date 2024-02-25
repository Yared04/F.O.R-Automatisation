const express = require('express');
const productController = require('../../controllers/product/productController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/products',authenticate, productController.getProducts);
router.post('/products', authenticate, productController.createProduct);
router.put('/products/:id', authenticate, productController.updateProduct);
router.delete('/products/:id', authenticate, productController.deleteProduct);
router.get('/products/:id', authenticate, productController.getProductById);

module.exports = router;