/**
 * Formats Zod validation issues into a consistent structure.
 * 
 * @param {Array} zodIssues - Array of ZodIssue objects from result.error.issues
 * @param {'body' | 'query' | 'params'} location - The location of the invalid data
 * @returns {Array<{ field: string, message: string, location: string }>}
 */
const formatValidationErrors = (zodIssues = [], location = 'body') => {
  return zodIssues.map((issue) => {
    // If issue.path is empty (e.g. from root-level .refine()), fallback to 'general'
    // Otherwise flatten nested paths with dot notation (e.g. ['items', 0, 'price'] -> 'items.0.price')
    const field = issue.path && issue.path.length > 0
      ? issue.path.join('.')
      : 'general';

    return {
      field,
      message: issue.message,
      location,
    };
  });
};

module.exports = { formatValidationErrors };
