const express = require('express');
const provisionController = require('../../controllers/provision/provisionController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/provisions', (req, res) => {
  req.requiredPermissions = ['GetProvisions'];
  authenticate(req, res, () => provisionController.getProvisions(req, res));
});

module.exports = router;