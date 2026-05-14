/**
 * Input validation middleware helpers.
 * Works standalone - no external package needed.
 * Compatible with express-validator API when package is installed.
 */

/**
 * Creates a validation middleware that checks required fields.
 * @param {Array<{field: string, type?: string, minLength?: number, maxLength?: number}>} rules
 */
function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];

    rules.forEach(rule => {
      const value = req.body[rule.field];
      const label = rule.label || rule.field;

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: rule.field, msg: `${label} is required` });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number' || rule.type === 'integer') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({ field: rule.field, msg: `${label} must be a number` });
          } else if (rule.min !== undefined && num < rule.min) {
            errors.push({ field: rule.field, msg: `${label} must be at least ${rule.min}` });
          } else if (rule.max !== undefined && num > rule.max) {
            errors.push({ field: rule.field, msg: `${label} must be at most ${rule.max}` });
          }
        }

        if (rule.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({ field: rule.field, msg: `${label} must be a valid email` });
          }
        }

        if (rule.type === 'string' || !rule.type) {
          if (rule.minLength && String(value).length < rule.minLength) {
            errors.push({ field: rule.field, msg: `${label} must be at least ${rule.minLength} characters` });
          }
          if (rule.maxLength && String(value).length > rule.maxLength) {
            errors.push({ field: rule.field, msg: `${label} must be at most ${rule.maxLength} characters` });
          }
          if (rule.enum && !rule.enum.includes(value)) {
            errors.push({ field: rule.field, msg: `${label} must be one of: ${rule.enum.join(', ')}` });
          }
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors, error: errors[0].msg });
    }
    next();
  };
}

// Validation rules for common entities
const permitValidation = validateBody([
  { field: 'project_name', required: true, minLength: 2, maxLength: 255 },
  { field: 'applicant_name', required: true, minLength: 2, maxLength: 255 },
  { field: 'property_address', required: true, minLength: 5, maxLength: 500 },
  { field: 'estimated_cost', type: 'number', min: 0 },
  { field: 'square_footage', type: 'number', min: 0 },
]);

const jurisdictionRuleValidation = validateBody([
  { field: 'jurisdiction', required: true, minLength: 2, maxLength: 255 },
  { field: 'rule_type', required: true, maxLength: 100 },
  { field: 'requirement', required: true, minLength: 5 },
]);

const feeEstimateValidation = validateBody([
  { field: 'permit_type', required: true },
  { field: 'project_value', required: true, type: 'number', min: 0 },
]);

const jurisdictionCheckValidation = validateBody([
  { field: 'address', required: true, minLength: 5 },
  { field: 'project_type', required: true },
]);

module.exports = {
  validateBody,
  permitValidation,
  jurisdictionRuleValidation,
  feeEstimateValidation,
  jurisdictionCheckValidation,
};
