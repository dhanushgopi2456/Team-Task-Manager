const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, searchUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.get('/search', auth, searchUsers);
router.get('/', auth, authorize('admin'), getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id/role', auth, authorize('admin'), updateUserRole);

module.exports = router;
