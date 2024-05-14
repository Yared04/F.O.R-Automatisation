const express = require('express');
const provisionController = require('../../controllers/provision/provisionController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/provisions', (req, res) => {
  req.requiredPermissions = ['GetProvisions'];
  authenticate(req, res, () => provisionController.getProvisions(req, res));
});

router.get('/provisions-summary', (req, res) => {
  req.requiredPermissions = ['GetProvisions'];
  authenticate(req, res, () => provisionController.getProvisionsByMonth(req, res));
});
module.exports = router;