const { body, param, query } = require('express-validator');

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be admin or member')
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const validateProject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived']).withMessage('Invalid status')
];

const validateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('project')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),
  body('assignedTo')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Invalid user ID'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601().withMessage('Invalid date format')
];

const validateTaskStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status')
];

const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProject,
  validateTask,
  validateTaskStatus,
  validateObjectId
};
