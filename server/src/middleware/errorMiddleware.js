/**
 * Central Error Sanitization & Handling Middleware
 * Prevents any raw database, MongoDB, or backend stack traces from leaking to clients.
 */

const sanitizeServerError = (err) => {
  if (!err) return 'An unexpected error occurred. Please try again.';

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return 'The requested record could not be found.';
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    return 'A record with these details already exists. Please check your information.';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const firstKey = Object.keys(err.errors || {})[0];
    if (firstKey && err.errors[firstKey]?.message) {
      return err.errors[firstKey].message;
    }
    return 'Please check your inputs and ensure all required fields are filled correctly.';
  }

  const raw = String(err.message || '').toLowerCase();

  // Database connection or engine issues
  if (
    raw.includes('mongo') ||
    raw.includes('connect') ||
    raw.includes('econnrefused') ||
    raw.includes('topology') ||
    raw.includes('buffering timed out') ||
    raw.includes('database') ||
    raw.includes('replica')
  ) {
    return 'Service is temporarily unable to reach the database. Please try again in a few moments.';
  }

  // JavaScript runtime errors or internal code leaks
  if (
    raw.includes('syntaxerror') ||
    raw.includes('typeerror') ||
    raw.includes('referenceerror') ||
    raw.includes('collection') ||
    raw.includes('schema') ||
    raw.includes('objectid') ||
    raw.includes('bson') ||
    raw.includes('server error:')
  ) {
    return 'Unable to complete your request at this time. Please try again.';
  }

  // Return clean message if safe, or fallback
  return err.message || 'An unexpected error occurred. Please try again.';
};

const errorHandler = (err, req, res, next) => {
  // Always log full diagnostic trace safely on the server
  console.error('\x1b[31m[Server Error]\x1b[0m', err.stack || err.message);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const safeMessage = sanitizeServerError(err);

  res.status(statusCode).json({
    success: false,
    message: safeMessage
  });
};

module.exports = {
  errorHandler,
  sanitizeServerError
};
