const express = require('express');
const driverController = require('../../controllers/driver/driverController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/drivers', authenticate, driverController.getDrivers);
router.post('/drivers', authenticate, driverController.createDriver);
router.put('/drivers/:id', authenticate, driverController.updateDriver);
router.delete('/drivers/:id', authenticate, driverController.deleteDriver);
router.get('/drivers/:id', authenticate, driverController.getDriverById);

module.exports = router;