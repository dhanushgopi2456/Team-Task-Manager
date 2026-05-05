const express = require('express');
const router = express.Router();
const {
  getProjects, createProject, getProjectById,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validateProject, validateObjectId } = require('../middleware/validate');
const { handleValidationErrors } = require('../middleware/errorHandler');

router.get('/', auth, getProjects);
router.post('/', auth, authorize('admin'), validateProject, handleValidationErrors, createProject);
router.get('/:id', auth, validateObjectId, handleValidationErrors, getProjectById);
router.put('/:id', auth, validateObjectId, handleValidationErrors, updateProject);
router.delete('/:id', auth, validateObjectId, handleValidationErrors, deleteProject);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);

module.exports = router;
