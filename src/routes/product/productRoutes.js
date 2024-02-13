const express = require('express');
const productController = require('../../controllers/product/productController');

const router = express.Router();

router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.get('/products/:id', productController.getProductById);

module.exports = router;