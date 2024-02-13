const express = require('express');
const driverController = require('../../controllers/driver/driverController');

const router = express.Router();

router.get('/drivers', driverController.getDrivers);
router.post('/drivers', driverController.createDriver);
router.put('/drivers/:id', driverController.updateDriver);
router.delete('/drivers/:id', driverController.deleteDriver);
router.get('/drivers/:id', driverController.getDriverById);

module.exports = router;