const express = require('express');
const router = express.Router();
const {
  getTasks, createTask, getTaskById,
  updateTask, deleteTask, updateTaskStatus,
  getDashboardStats, getOverdueTasks
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validateTask, validateTaskStatus, validateObjectId } = require('../middleware/validate');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Dashboard routes (must be before /:id routes)
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/dashboard/overdue', auth, getOverdueTasks);

router.get('/', auth, getTasks);
router.post('/', auth, authorize('admin'), validateTask, handleValidationErrors, createTask);
router.get('/:id', auth, validateObjectId, handleValidationErrors, getTaskById);
router.put('/:id', auth, validateObjectId, handleValidationErrors, updateTask);
router.delete('/:id', auth, authorize('admin'), validateObjectId, handleValidationErrors, deleteTask);
router.patch('/:id/status', auth, validateObjectId, validateTaskStatus, handleValidationErrors, updateTaskStatus);

module.exports = router;
