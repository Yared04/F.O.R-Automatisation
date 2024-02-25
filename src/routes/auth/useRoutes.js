const express = require('express');
const userController = require('../../controllers/auth/userContoller');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/users',authenticate, userController.getUsers);
router.get('/users/:id', authenticate, userController.getUserById);
router.post('/users',authenticate, userController.createUser);
router.put('/users/:id', authenticate, userController.updateUser);
router.delete('/users/:id', authenticate, userController.deleteUser);

router.post('/login', userController.login);
router.post('/refresh', userController.refreshToken);

module.exports = router;
