const express = require('express');
const roleController = require('../../controllers/auth/roleController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/roles',authenticate, roleController.getRoles);

module.exports = router;