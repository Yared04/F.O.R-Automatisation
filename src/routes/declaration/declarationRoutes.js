const express = require('express');
const declarationController = require('../../controllers/declaration/declarationController')
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/declarations', authenticate, declarationController.getDeclarations);
router.post('/declarations', authenticate, declarationController.createDeclaration);
router.put('/declarations/:id', authenticate, declarationController.updateDeclaration);
router.delete('/declarations/:id', authenticate, declarationController.deleteDeclaration);
router.get('/declarations/:id', authenticate, declarationController.getDeclarationById);

module.exports = router;