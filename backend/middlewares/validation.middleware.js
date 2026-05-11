const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user authentication (register / login).
 * - email: must not be empty and must be a valid email format
 * - password: must be at least 6 characters long
 */
const authValidationRules = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

/**
 * Middleware that reads the result of express-validator checks.
 * If any validation errors exist, responds with HTTP 400 and a structured
 * error list. Otherwise, passes control to the next handler.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = {
  authValidationRules,
  handleValidationErrors,
};
