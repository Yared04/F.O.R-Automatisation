const express = require('express');
const declarationController = require('../../controllers/declaration/declarationController')

const router = express.Router();

router.get('/declarations', declarationController.getDeclarations);
router.post('/declarations', declarationController.createDeclaration);
// router.put('/declarations/:id', declarationController.updateDeclaration);
router.delete('/declarations/:id', declarationController.deleteDeclaration);
router.get('/declarations/:id', declarationController.getDeclarationById);

module.exports = router;