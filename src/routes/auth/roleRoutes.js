const express = require('express');
const roleController = require('../../controllers/auth/roleController');
const permsssionController = require('../../controllers/auth/permissionController');
const authenticate = require('../../middlewares/authenticate')

const router = express.Router();

router.get('/roles',authenticate, roleController.getRoles);
router.post('/roles',authenticate, roleController.createRole);
router.put('/roles/:id',authenticate, roleController.updateRole);
router.delete('/roles/:id',authenticate, roleController.deleteRole);
router.get('/roles/:roleId/permissions', roleController.getRolePermissions);


router.get('/permissions', authenticate, permsssionController.getPermissions);
router.post('/roles/:roleId/assign-revoke-permissions', authenticate, permsssionController.assignRevokePermissionsToRole);


module.exports = router;