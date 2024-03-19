const express = require('express');
const declarationController = require('../../controllers/declaration/declarationController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/declarations', (req, res) => {
  req.requiredPermissions = ['GetDeclarations'];
  authenticate(req, res, () => declarationController.getDeclarations(req, res));
});

router.post('/declarations', (req, res) => {
  req.requiredPermissions = ['CreateDeclaration'];
  authenticate(req, res, () => declarationController.createDeclaration(req, res));
});

router.put('/declarations/:id', (req, res) => {
  req.requiredPermissions = ['UpdateDeclaration'];
  authenticate(req, res, () => declarationController.updateDeclaration(req, res));
});

router.delete('/declarations/:id', (req, res) => {
  req.requiredPermissions = ['DeleteDeclaration'];
  authenticate(req, res, () => declarationController.deleteDeclaration(req, res));
});

router.get('/declarations/:id', (req, res) => {
  req.requiredPermissions = ['GetDeclarationById'];
  authenticate(req, res, () => declarationController.getDeclarationById(req, res));
});

router.delete('/declaration-detail/:id', (req, res) => {
  req.requiredPermissions = ['DeleteDeclarationDetail'];
  authenticate(req, res, () => declarationController.deleteProductDeclaration(req, res));
});

router.put('/declaration-detail/:id', (req, res) => {
  req.requiredPermissions = ['UpdateDeclarationDetail'];
  authenticate(req, res, () => declarationController.updateProductDeclaration(req, res));
});

router.post('/declaration-detail', (req, res) => {
  req.requiredPermissions = ['CreateDeclarationDetail'];
  authenticate(req, res, () => declarationController.createProductDeclaration(req, res));
});

module.exports = router;
