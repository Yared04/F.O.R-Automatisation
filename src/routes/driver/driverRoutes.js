const express = require('express');
const driverController = require('../../controllers/driver/driverController');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);

router.get('/drivers', (req, res) => {
  req.requiredPermissions = ['GetDrivers'];
  authenticate(req, res, () => driverController.getDrivers(req, res));
});

router.post('/drivers', (req, res) => {
  req.requiredPermissions = ['CreateDriver'];
  authenticate(req, res, () => driverController.createDriver(req, res));
});

router.put('/drivers/:id', (req, res) => {
  req.requiredPermissions = ['UpdateDriver'];
  authenticate(req, res, () => driverController.updateDriver(req, res));
});

router.delete('/drivers/:id', (req, res) => {
  req.requiredPermissions = ['DeleteDriver'];
  authenticate(req, res, () => driverController.deleteDriver(req, res));
});

router.get('/drivers/:id', (req, res) => {
  req.requiredPermissions = ['GetDriverById'];
  authenticate(req, res, () => driverController.getDriverById(req, res));
});

module.exports = router;
